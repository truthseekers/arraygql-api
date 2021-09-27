const typeDefs = `
type Query {
    helloWorld: String!
    users(text: String): [User!]!
    todos(filter: String, takeStatus: String, skip: Int, take: Int): Todos!
    me: User
}
type Mutation {
  login(email: String!, password: String!): User
  logout: Boolean
  signup(firstName: String!, email: String!, password: String!, age: Int, paymentMethod: String!): User
  createTodo(name: String!, isComplete: Boolean!, userId: ID!): Todo
  deleteTodo(todoId: ID!): Todo
  updateTodo(todoId: ID!, name: String, isComplete: Boolean): Todo
  deleteTodos(todoIds: [ID!]): BatchPayload!
  resetTodos: BatchPayload!
}

type User {
  id: ID!
  firstName: String!
  email: String!
  age: Int
  todos(text: String): [Todo!]!
}

type Todo {
  id: ID!
  name: String!
  isComplete: Boolean!
  user: User!
  userId: ID!
}

type Todos {
  count: Int!
  todoItems: [Todo!]
}

type BatchPayload {
  count: Int!
}

`;

module.exports = {
  typeDefs,
};
