import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';

@Injectable()
export class IntegrationsService {
  constructor(private readonly httpService: HttpService) {}

  handleWebhook(body: any) {
    const { source, event, data } = body;
    console.log(`Webhook received from ${source}:`, event);
    return { received: true, timestamp: new Date().toISOString() };
  }

  getStatus() {
    return {
      integrations: {
        slack: !!process.env.SLACK_WEBHOOK_URL,
        email: !!process.env.SMTP_HOST,
        stripe: !!process.env.STRIPE_SECRET_KEY,
        github: !!process.env.GITHUB_WEBHOOK_SECRET,
      },
    };
  }

  async sendSlackMessage(body: { channel: string; text: string }) {
    const webhookUrl = process.env.SLACK_WEBHOOK_URL;
    if (!webhookUrl) {
      return { error: 'SLACK_WEBHOOK_URL not configured' };
    }
    try {
      await this.httpService.post(webhookUrl, body).toPromise();
      return { sent: true };
    } catch (error) {
      return { error: 'Failed to send message', message: error.message };
    }
  }

  handleGitHubWebhook(body: any) {
    console.log('GitHub webhook received');
    return { received: true };
  }

  handleStripeWebhook(body: any) {
    console.log('Stripe webhook received');
    return { received: true };
  }
}
