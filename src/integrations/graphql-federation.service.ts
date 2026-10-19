// GraphQL Federation: this API is an Apollo Federation 2 subgraph (see app.module.ts, @key on User and
// Post). This file builds the Apollo Gateway that composes it with other subgraphs; run it with
// `npm run start:gateway` (src/gateway/main.ts).
import { ApolloGateway, IntrospectAndCompose, RemoteGraphQLDataSource } from '@apollo/gateway';

/** GRAPHQL_SUBGRAPHS="enterprise=http://localhost:4000/graphql,billing=http://billing:4100/graphql" */
export function subgraphsFromEnv(): { name: string; url: string }[] {
  const raw = process.env.GRAPHQL_SUBGRAPHS || `enterprise=http://localhost:${process.env.PORT || 4000}/graphql`;
  return raw.split(',').map((pair) => {
    const [name, url] = pair.split('=');
    return { name: name.trim(), url: url.trim() };
  });
}

/** Forwards the caller's Authorization header to every subgraph. */
class AuthForwardingDataSource extends RemoteGraphQLDataSource {
  willSendRequest({ request, context }: { request: { http?: { headers: { set(k: string, v: string): void } } }; context: { authorization?: string } }) {
    if (context.authorization) request.http?.headers.set('authorization', context.authorization);
  }
}

export function createGateway() {
  return new ApolloGateway({
    supergraphSdl: new IntrospectAndCompose({ subgraphs: subgraphsFromEnv(), pollIntervalInMs: Number(process.env.GATEWAY_POLL_MS || 0) || undefined }),
    buildService: ({ url }) => new AuthForwardingDataSource({ url }),
  });
}
