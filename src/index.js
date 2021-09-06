const { ApolloServer } = require("apollo-server-express");
const http = require("http");
const express = require("express");
const {
  ApolloServerPluginDrainHttpServer,
  ApolloServerPluginLandingPageGraphQLPlayground,
} = require("apollo-server-core");
const { users } = require("./data/users");

const app = express();

const httpServer = http.createServer(app);

const typeDefs = `
type Query {
    helloWorld: String!
    users: [User!]!
}

type User {
  id: ID!
  firstName: String!
  email: String!
  age: Int
}

`;

const resolvers = {
  Query: {
    helloWorld: () => `Hi there dude!!`,
    users: () => {
      console.log("users resolver: ", users);
      return users;
    },
  },
  // User: {
  //   id: (parent) => {
  //     console.log("what is the parent? ", parent);
  //     return parent.id;
  //   },
  //   firstName: (parent) => parent.firstName,
  //   email: (parent) => parent.email,
  //   age: (parent) => parent.age,
  // },
};

const corsOptions = {
  credentials: true,
  origin: [process.env.ORIGIN, "https://studio.apollographql.com"],
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
  plugins: [
    ApolloServerPluginDrainHttpServer({ httpServer }),
    ApolloServerPluginLandingPageGraphQLPlayground(),
  ],
});

const startServer = async () => {
  await server.start();
  server.applyMiddleware({ app, cors: corsOptions });
  await new Promise((resolve) => httpServer.listen({ port: 4000 }, resolve));
  console.log(`Server ready at http://localhost:4000`);
};

startServer();
