import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import { fetchTodos, createTodo } from './resolvers/todoResolvers.js';

// Here, we define our graphql schema
const typeDefs = `#graphql
  # Comments in GraphQL strings (such as this one) start with the hash (#) symbol.
  
    type Todo {
        id: ID!
        text: String!
        done: Boolean!
        user: User!
    }

    type User {
        id: ID!
        name: String!
    }

    input NewTodo {
        text: String!
        name: String!
    }

    type Query {
        todos: [Todo!]!
    }

    type Mutation {
        createTodo(input: NewTodo!): Todo!
    }    
`;

const resolvers = {
  Query: {
    todos: () => fetchTodos(),
  },
  Mutation: {
    createTodo: (_: any, { input }: { input: { text: string, name: string } }) => {
      return createTodo(input.text, input.name); 
    }
  },
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
});

const { url } = await startStandaloneServer(server, {
  listen: { port: 4000 },
});

console.log(`🚀 Server ready at: ${url}`);