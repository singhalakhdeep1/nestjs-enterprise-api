import { BadRequestException, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { RabbitMQService } from './rabbitmq.service';
import { ElasticsearchService } from './elasticsearch.service';
import { EventStoreService } from './eventstore.service';
import { RedisService } from './redis.service';

const safeEqual = (a: string, b: string) => {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
};

/** Webhooks (GitHub, Stripe, generic) with signature verification, Slack notifications, integration status. */
@Injectable()
export class IntegrationsService {
  private readonly logger = new Logger(IntegrationsService.name);

  constructor(
    private readonly rabbit: RabbitMQService,
    private readonly es: ElasticsearchService,
    private readonly eventStore: EventStoreService,
    private readonly redis: RedisService,
  ) {}

  /** Generic webhook: `X-Webhook-Signature: sha256=<hmac(WEBHOOK_SECRET, raw body)>`. */
  async handleWebhook(raw: Buffer | undefined, signature: string | undefined, body: { source?: string; event?: string; data?: unknown }) {
    const secret = process.env.WEBHOOK_SECRET;
    if (!secret) throw new UnauthorizedException('WEBHOOK_SECRET is not configured');
    const expected = `sha256=${createHmac('sha256', secret).update(raw ?? Buffer.alloc(0)).digest('hex')}`;
    if (!signature || !safeEqual(signature, expected)) throw new UnauthorizedException('Invalid webhook signature');
    if (!body.source || !body.event) throw new BadRequestException('source and event are required');
    await this.record('webhook', body.source, body.event, body.data);
    return { received: true, source: body.source, event: body.event, timestamp: new Date().toISOString() };
  }

  /** GitHub: X-Hub-Signature-256 = sha256=HMAC(GITHUB_WEBHOOK_SECRET, raw body). */
  async handleGitHubWebhook(raw: Buffer | undefined, signature: string | undefined, event: string | undefined, body: Record<string, any>) {
    const secret = process.env.GITHUB_WEBHOOK_SECRET;
    if (!secret) throw new UnauthorizedException('GITHUB_WEBHOOK_SECRET is not configured');
    const expected = `sha256=${createHmac('sha256', secret).update(raw ?? Buffer.alloc(0)).digest('hex')}`;
    if (!signature || !safeEqual(signature, expected)) throw new UnauthorizedException('Invalid GitHub signature');
    const summary = {
      event: event ?? 'unknown',
      repository: body.repository?.full_name,
      sender: body.sender?.login,
      action: body.action,
      ref: body.ref,
      commits: Array.isArray(body.commits) ? body.commits.length : undefined,
    };
    await this.record('github', 'github', summary.event, summary);
    return { received: true, ...summary };
  }

  /** Stripe: Stripe-Signature `t=<ts>,v1=<hmac(STRIPE_WEBHOOK_SECRET, "<ts>.<body>")>`, 5-minute tolerance. */
  async handleStripeWebhook(raw: Buffer | undefined, header: string | undefined, body: Record<string, any>) {
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!secret) throw new UnauthorizedException('STRIPE_WEBHOOK_SECRET is not configured');
    const parts = Object.fromEntries((header ?? '').split(',').map((p) => p.split('=') as [string, string]));
    const ts = Number(parts.t);
    if (!ts || !parts.v1) throw new UnauthorizedException('Malformed Stripe-Signature');
    if (Math.abs(Date.now() / 1000 - ts) > 300) throw new UnauthorizedException('Stripe signature timestamp outside tolerance');
    const expected = createHmac('sha256', secret).update(`${ts}.${(raw ?? Buffer.alloc(0)).toString('utf8')}`).digest('hex');
    if (!safeEqual(parts.v1, expected)) throw new UnauthorizedException('Invalid Stripe signature');
    await this.record('stripe', 'stripe', body.type, { id: body.id, type: body.type, object: body.data?.object?.object });
    return { received: true, id: body.id, type: body.type };
  }

  private async record(kind: string, source: string, event: string, data: unknown) {
    this.logger.log(`${kind} webhook: ${source}/${event}`);
    await this.rabbit.publish(`webhook.${source}.${event}`, { source, event, data });
    await this.redis.lpush('webhooks:recent', JSON.stringify({ source, event, at: new Date().toISOString() }));
  }

  async recentWebhooks() {
    return (await this.redis.lrange('webhooks:recent', 0, 49)).map((s) => JSON.parse(s));
  }

  async sendSlackMessage(body: { channel?: string; text: string }) {
    const webhookUrl = process.env.SLACK_WEBHOOK_URL;
    if (!webhookUrl) return { sent: false, error: 'SLACK_WEBHOOK_URL not configured' };
    const res = await fetch(webhookUrl, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body), signal: AbortSignal.timeout(5000) });
    return res.ok ? { sent: true } : { sent: false, error: `Slack responded ${res.status}` };
  }

  async getStatus() {
    return {
      integrations: {
        elasticsearch: await this.es.health(),
        rabbitmq: this.rabbit.status(),
        eventstore: await this.eventStore.health(),
        redis: this.redis.status(),
        grpc: process.env.GRPC_URL || '0.0.0.0:50051',
        slack: Boolean(process.env.SLACK_WEBHOOK_URL),
        github: Boolean(process.env.GITHUB_WEBHOOK_SECRET),
        stripe: Boolean(process.env.STRIPE_WEBHOOK_SECRET),
        webhook: Boolean(process.env.WEBHOOK_SECRET),
      },
    };
  }
}
