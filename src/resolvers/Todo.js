const { users } = require("../data/users");

const Todo = {
  user: (parent) => {
    const currentUser = users.find((user) => user.id == parent.userId);
    return currentUser;
  },
};

module.exports = { Todo };
