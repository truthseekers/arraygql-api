const { users } = require("../data/users");
const { todos } = require("../data/todos");

const Query = {
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
};

module.exports = {
  Query,
};
