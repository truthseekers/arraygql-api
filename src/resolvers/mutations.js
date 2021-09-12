const { todos } = require("../data/todos");
const { users } = require("../data/users");
const bcrypt = require("bcrypt");
const { v4: uuidv4 } = require("uuid");

const Mutation = {
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
    const currentTodoIndex = todos.findIndex((todo) => todo.id == args.todoId);

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
};

module.exports = { Mutation };
