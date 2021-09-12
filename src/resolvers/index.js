const { Mutation } = require("./mutations");
const { Query } = require("./queries");
const { User } = require("./User");
const { Todo } = require("./Todo");

const resolvers = {
  Query,
  Mutation,
  User,
  Todo,
};

module.exports = {
  resolvers,
};
