const { todos } = require("../data/todos");

const User = {
  id: (parent) => {
    return parent.id;
  },
  firstName: (parent) => parent.firstName,
  email: (parent) => parent.email,
  age: (parent) => parent.age,
  todos: (parent, args, context, info) => {
    // console.log("args: ", args);
    return todos.filter((todo) => todo.userId == parent.id);
  },
};

module.exports = {
  User,
};
