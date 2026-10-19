import { Global, Module } from '@nestjs/common';
import { IntegrationsController } from './integrations.controller';
import { IntegrationsService } from './integrations.service';
import { ElasticsearchService } from './elasticsearch.service';
import { RabbitMQService } from './rabbitmq.service';
import { EventStoreService } from './eventstore.service';
import { RedisService } from './redis.service';
import { GrpcService } from './grpc.service';
import { EnterpriseGrpcController } from './grpc.controller';

@Global()
@Module({
  controllers: [IntegrationsController, EnterpriseGrpcController],
  providers: [IntegrationsService, ElasticsearchService, RabbitMQService, EventStoreService, RedisService, GrpcService],
  exports: [IntegrationsService, ElasticsearchService, RabbitMQService, EventStoreService, RedisService, GrpcService],
})
export class IntegrationsModule {}
