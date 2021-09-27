const { ApolloServer } = require("apollo-server-express");
const http = require("http");
const express = require("express");
const {
  ApolloServerPluginDrainHttpServer,
  ApolloServerPluginLandingPageGraphQLPlayground,
} = require("apollo-server-core");
const { users } = require("./data/users");
const { v4: uuidv4 } = require("uuid");
const bcrypt = require("bcrypt");
const passport = require("passport");
const { GraphQLLocalStrategy, buildContext } = require("graphql-passport");
const session = require("express-session");
const SESSION_SECRET = "asdlfkwheifahoalkhj12hahiw";
const { typeDefs } = require("./typeDefs");
const { resolvers } = require("./resolvers");
require("dotenv").config();

passport.serializeUser((user, done) => {
  done(null, user.id); // what you want to pass into the session (you could pass entire user if you wanted.
});

passport.deserializeUser((id, done) => {
  const currentUser = users.find((user) => {
    if (user.id == id) {
      return user;
    }
  });

  // console.log("deserialized user in passport.deserializeUser: ", currentUser);

  done(null, currentUser);
});

passport.use(
  new GraphQLLocalStrategy(async (email, password, done) => {
    // console.log("Login two");
    // console.log("email from args: ", email);

    const matchingUser = await users.find((user) => {
      if (user.email == email) {
        return user;
      }
    });

    // console.log("matching user: ", matchingUser);

    let error = matchingUser ? "" : new Error("User not found!");

    if (matchingUser) {
      const valid = await bcrypt.compare(password, matchingUser.password);

      error = valid ? "" : new Error("Invalid password");
    }

    // console.log("Login three");

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

const corsOptions = {
  credentials: true,
  origin: ["http://localhost:3000", "https://studio.apollographql.com"],
};

// console.log("origin: ", process.env.ORIGIN);

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
