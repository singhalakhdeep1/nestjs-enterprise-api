import { Controller, Get, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { IntegrationsService } from './integrations.service';

@ApiTags('integrations')
@Controller('integrations')
export class IntegrationsController {
  constructor(private readonly integrationsService: IntegrationsService) {}

  @Post('webhook')
  @ApiOperation({ summary: 'Generic webhook handler' })
  handleWebhook(@Body() body: any) {
    return this.integrationsService.handleWebhook(body);
  }

  @Get('status')
  @ApiOperation({ summary: 'Integration status' })
  getStatus() {
    return this.integrationsService.getStatus();
  }

  @Post('slack/send')
  @ApiOperation({ summary: 'Send Slack message' })
  sendSlackMessage(@Body() body: { channel: string; text: string }) {
    return this.integrationsService.sendSlackMessage(body);
  }

  @Post('github/webhook')
  @ApiOperation({ summary: 'GitHub webhook handler' })
  handleGitHubWebhook(@Body() body: any) {
    return this.integrationsService.handleGitHubWebhook(body);
  }

  @Post('stripe/webhook')
  @ApiOperation({ summary: 'Stripe webhook handler' })
  handleStripeWebhook(@Body() body: any) {
    return this.integrationsService.handleStripeWebhook(body);
  }
}
