// GraphQL Federation integration for nestjs-enterprise-api

import { Injectable } from '@nestjs/common';
import { ApolloGatewayDriver, ApolloGatewayDriverConfig } from '@nestjs/apollo';
import { GraphQLModule } from '@nestjs/graphql';
import { IntrospectionAndReflectionDirective } from '@apollo/gateway';
import { loadFileSync } from 'fs';
import { join } from 'path';

@Injectable()
export class GraphQLFederationService {
  static forRoot() {
    return GraphQLModule.forRoot<ApolloGatewayDriverConfig>({
      driver: ApolloGatewayDriver,
      gateway: {
        supergraphSdl: new IntrospectionAndReflectionDirective({
          supergraphSdl: loadFileSync(join(process.cwd(), 'supergraph.graphql')).toString(),
        }),
        serviceList: [
          { name: 'users', url: 'http://localhost:3001/graphql' },
          { name: 'posts', url: 'http://localhost:3002/graphql' },
          { name: 'auth', url: 'http://localhost:3003/graphql' },
        ],
      },
      subscriptions: {
        'graphql-ws': true,
      },
    });
  }

  static forFeature() {
    return GraphQLModule.forRoot({
      typePaths: ['./**/*.graphql'],
      federation: true,
      buildSchemaOptions: {
        directives: [
          '@key(fields: "id")',
          '@shareable',
          '@extends',
          '@external',
          '@provides(fields: "...")',
          '@requires(fields: "...")',
        ],
      },
    });
  }
}

// Example federated schema for users service
export const usersSchema = `
  extend type Query {
    me: User
    users: [User!]!
    user(id: ID!): User
  }

  type User @key(fields: "id") {
    id: ID!
    name: String!
    email: String!
    posts: [Post!]!
  }

  extend type Post @key(fields: "id") {
    id: ID! @external
    author: User! @provides(fields: "id name")
  }
`;

// Example federated schema for posts service
export const postsSchema = `
  extend type Query {
    posts: [Post!]!
    post(id: ID!): Post
  }

  type Post @key(fields: "id") {
    id: ID!
    title: String!
    content: String!
    authorId: ID!
    author: User! @provides(fields: "id")
  }

  extend type User @key(fields: "id") {
    id: ID! @external
    posts: [Post!]!
  }
`;

// Example federated schema for auth service
export const authSchema = `
  extend type Query {
    login(email: String!, password: String!): AuthPayload!
    logout: Boolean!
  }

  extend type Mutation {
    register(email: String!, password: String!): AuthPayload!
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  extend type User @key(fields: "id") {
    id: ID! @external
    email: String! @external
  }
`;
