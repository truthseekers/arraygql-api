const { ApolloServer } = require("apollo-server-express");
const http = require("http");
const express = require("express");
const {
  ApolloServerPluginDrainHttpServer,
  ApolloServerPluginLandingPageGraphQLPlayground,
} = require("apollo-server-core");
const { users } = require("./data/users");
const { todos } = require("./data/todos");
const { v4: uuidv4 } = require("uuid");
const bcrypt = require("bcrypt");

const app = express();

const httpServer = http.createServer(app);

const typeDefs = `
type Query {
    helloWorld: String!
    users(text: String): [User!]!
    todos(filter: String, takeStatus: String, skip: Int, take: Int): [Todo!]!
}
type Mutation {
  signup(firstName: String!, email: String!, password: String!, age: Int): User
  createTodo(name: String!, isComplete: Boolean!, userId: ID!): Todo
  deleteTodo(todoId: ID!): Todo
  updateTodo(todoId: ID!, name: String, isComplete: Boolean): Todo
  deleteTodos(todoIds: [ID!]): BatchPayload!
}

type User {
  id: ID!
  firstName: String!
  email: String!
  age: Int
}

type Todo {
  id: ID!
  name: String!
  isComplete: Boolean!
  userId: ID!
}

type BatchPayload {
  count: Int!
}

`;

const resolvers = {
  Query: {
    helloWorld: () => `Hi there dude!!`,
    users: (parent, args, context, info) => {
      if (args.text) {
        return users.filter((elem) =>
          elem.firstName.toLowerCase().includes(args.text.toLowerCase())
        );
      }
      console.log(users);
      return users;
    },
    todos: (parent, args, context, info) => {
      let isComplete = args.takeStatus == "complete" ? true : false;

      const allTodoItems = todos.filter((todo) => {
        if (isComplete !== todo.isComplete) {
          return;
        }
        if (args.filter && !todo.name.includes(args.filter)) {
          return;
        }

        return todo;
      });

      if (args.skip || args.take) {
        return allTodoItems.slice(args.skip, args.skip + args.take);
      }

      return allTodoItems;
      // return todos;
    },
  },
  Mutation: {
    signup: async (parent, args, context, info) => {
      const password = await bcrypt.hash(args.password, 10);

      console.log("password: ", password);

      const newUser = {
        id: uuidv4(),
        firstName: args.firstName,
        email: args.email,
        password: password,
        age: args.age,
      };
      console.log("args: ", args);
      console.log("newUser is: ", newUser);
      users.push(newUser);

      return newUser;
    },
    createTodo: async (parent, { name, isComplete, userId }, context, info) => {
      const newTodo = {
        id: uuidv4(),
        name,
        isComplete,
        userId,
      };

      todos.push(newTodo);

      return newTodo;
    },
    deleteTodo: (parent, args, context, info) => {
      const indexToDelete = todos.findIndex((elem) => elem.id == args.todoId);

      const deletedTodo = todos.splice(indexToDelete, 1);
      return deletedTodo[0];
    },
    updateTodo: (parent, args, context, info) => {
      const currentTodoIndex = todos.findIndex(
        (todo) => todo.id == args.todoId
      );

      if (args.name) {
        todos[currentTodoIndex].name = args.name;
      }
      if (args.hasOwnProperty("isComplete")) {
        todos[currentTodoIndex].isComplete = args.isComplete;
      }

      return todos[currentTodoIndex];
    },
    deleteTodos: (parent, args, context, info) => {
      let deleteCount = 0;
      for (let i = 0; i < args.todoIds.length; i++) {
        const indexToDelete = todos.findIndex(
          (todo) => todo.id == args.todoIds[i]
        );
        if (indexToDelete.toString()) {
          deleteCount++;
          todos.splice(indexToDelete, 1);
        }
      }

      return { count: deleteCount };
    },
  },
  User: {
    id: (parent) => {
      return parent.id;
    },
    firstName: (parent) => parent.firstName,
    email: (parent) => parent.email,
    age: (parent) => parent.age,
  },
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
