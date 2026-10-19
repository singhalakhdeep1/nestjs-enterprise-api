import { Body, Controller, Delete, Get, Headers, HttpCode, Param, Patch, Post, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { IsObject, IsOptional, IsString } from 'class-validator';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';
import { IntegrationsService } from './integrations.service';
import { GrpcService } from './grpc.service';
import { Public, Roles } from '../common/decorators/public.decorator';

class SlackDto {
  @IsOptional() @IsString() channel?: string;
  @IsString() text: string;
}

class EntityDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() type?: string;
  @IsOptional() @IsObject() attributes?: Record<string, string>;
}

@ApiTags('integrations')
@Controller('integrations')
export class IntegrationsController {
  constructor(private readonly integrationsService: IntegrationsService, private readonly grpc: GrpcService) {}

  @Public()
  @SkipThrottle()
  @Post('webhook')
  @HttpCode(200)
  @ApiOperation({ summary: 'Generic webhook (X-Webhook-Signature: sha256=HMAC of body)' })
  handleWebhook(@Req() req: RawBodyRequest<Request>, @Headers('x-webhook-signature') sig: string, @Body() body: any) {
    return this.integrationsService.handleWebhook(req.rawBody, sig, body);
  }

  @Public()
  @SkipThrottle()
  @Post('github/webhook')
  @HttpCode(200)
  @ApiOperation({ summary: 'GitHub webhook (X-Hub-Signature-256 verified)' })
  handleGitHubWebhook(@Req() req: RawBodyRequest<Request>, @Headers('x-hub-signature-256') sig: string, @Headers('x-github-event') event: string, @Body() body: any) {
    return this.integrationsService.handleGitHubWebhook(req.rawBody, sig, event, body);
  }

  @Public()
  @SkipThrottle()
  @Post('stripe/webhook')
  @HttpCode(200)
  @ApiOperation({ summary: 'Stripe webhook (Stripe-Signature verified)' })
  handleStripeWebhook(@Req() req: RawBodyRequest<Request>, @Headers('stripe-signature') sig: string, @Body() body: any) {
    return this.integrationsService.handleStripeWebhook(req.rawBody, sig, body);
  }

  @Get('status')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Integration status' })
  getStatus() {
    return this.integrationsService.getStatus();
  }

  @Get('webhooks/recent')
  @ApiBearerAuth()
  @Roles('ADMIN')
  recent() {
    return this.integrationsService.recentWebhooks();
  }

  @Post('slack/send')
  @ApiBearerAuth()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Send Slack message' })
  sendSlackMessage(@Body() body: SlackDto) {
    return this.integrationsService.sendSlackMessage(body);
  }

  // REST bridge over the gRPC EnterpriseService client.
  @Post('grpc/entities')
  @ApiBearerAuth()
  createEntity(@Body() dto: EntityDto) {
    return this.grpc.createEntity({ name: dto.name ?? '', type: dto.type ?? '', attributes: dto.attributes });
  }

  @Get('grpc/entities')
  @ApiBearerAuth()
  listEntities() {
    return this.grpc.streamEntities();
  }

  @Get('grpc/entities/:id')
  @ApiBearerAuth()
  getEntity(@Param('id') id: string) {
    return this.grpc.getEntity(id);
  }

  @Patch('grpc/entities/:id')
  @ApiBearerAuth()
  updateEntity(@Param('id') id: string, @Body() dto: EntityDto) {
    return this.grpc.updateEntity(id, dto);
  }

  @Delete('grpc/entities/:id')
  @ApiBearerAuth()
  deleteEntity(@Param('id') id: string) {
    return this.grpc.deleteEntity(id);
  }
}
