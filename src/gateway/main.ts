// Standalone Apollo Federation gateway composing the subgraphs listed in GRAPHQL_SUBGRAPHS.
import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import { createGateway, subgraphsFromEnv } from '../integrations/graphql-federation.service';

async function main() {
  const server = new ApolloServer({ gateway: createGateway() });
  const port = Number(process.env.GATEWAY_PORT || 4001);
  const { url } = await startStandaloneServer(server, {
    listen: { port },
    context: async ({ req }) => ({ authorization: req.headers.authorization }),
  });
  console.log(JSON.stringify({ level: 'Information', message: `Federation gateway at ${url}`, subgraphs: subgraphsFromEnv() }));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
