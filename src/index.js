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
const passport = require("passport");
const { GraphQLLocalStrategy, buildContext } = require("graphql-passport");
const session = require("express-session");
const SESSION_SECRET = "asdlfkwheifahoalkhj12hahiw";
const { typeDefs } = require("./typeDefs");

passport.serializeUser((user, done) => {
  done(null, user.id); // what you want to pass into the session (you could pass entire user if you wanted.
});

passport.deserializeUser((id, done) => {
  const currentUser = users.find((user) => {
    if (user.id == id) {
      return user;
    }
  });

  console.log("deserialized user in passport.deserializeUser: ", currentUser);

  done(null, currentUser);
});

passport.use(
  new GraphQLLocalStrategy(async (email, password, done) => {
    console.log("Login two");
    console.log("email from args: ", email);

    const matchingUser = await users.find((user) => {
      if (user.email == email) {
        return user;
      }
    });

    console.log("matching user: ", matchingUser);

    let error = matchingUser ? "" : new Error("User not found!");

    if (matchingUser) {
      const valid = await bcrypt.compare(password, matchingUser.password);

      error = valid ? "" : new Error("Invalid password");
    }

    console.log("Login three");

    done(error, matchingUser); // returns matchingUser back to return value of calling context.authenticate in the resolver.
  })
);

const app = express();

app.use(
  session({
    genid: () => uuidv4(),
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false, // prevents new empty sessions from being created.
  })
);

app.use(passport.initialize());
app.use(passport.session());

const httpServer = http.createServer(app);

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
        return {
          todoItems: allTodoItems.slice(args.skip, args.skip + args.take),
          count: allTodoItems.length,
        };
      }

      return {
        todoItems: allTodoItems,
        count: allTodoItems.length,
      };
      // return allTodoItems;
      // return todos;
    },
    me: (parent, args, context, info) => {
      console.log("getUser from me: ", context.getUser());
      return context.getUser();
    },
  },
  Mutation: {
    login: async (parent, { email, password }, context, info) => {
      console.log("login one");

      // prove the user is who they say they are, and that this user is already signed up.
      // passport provides a shell, but we have to fill in the details. We tell it HOW to authenticate.
      // pass in the login details required to verify. see new GraphQLLocalStrategy for step 2.

      const { user } = await context.authenticate("graphql-local", {
        email, // arg passed in
        password, // arg passed in.
      });

      console.log("Login 4: user - ", user);

      context.login(user); // calls passport.serializeUser();

      return user;
    },
    logout: (parent, args, context, info) => {
      context.logout();
    },
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

      const { user } = await context.authenticate("graphql-local", {
        email: args.email,
        password: args.password,
      });

      context.login(user);

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
    resetTodos: (parent, args, context, info) => {
      let changeCount = 0;

      for (let i = 0; i < todos.length; i++) {
        if (todos[i].isComplete) {
          todos[i].isComplete = false;
          changeCount++;
        }
      }

      return { count: changeCount };
    },
  },
  User: {
    id: (parent) => {
      return parent.id;
    },
    firstName: (parent) => parent.firstName,
    email: (parent) => parent.email,
    age: (parent) => parent.age,
    todos: (parent, args, context, info) => {
      console.log("args: ", args);
      return todos.filter((todo) => todo.userId == parent.id);
    },
  },
  Todo: {
    user: (parent) => {
      const currentUser = users.find((user) => user.id == parent.userId);
      return currentUser;
    },
  },
};

const corsOptions = {
  credentials: true,
  origin: [process.env.ORIGIN, "https://studio.apollographql.com"],
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: ({ req, res }) => {
    return buildContext({ req, res });
  },
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
