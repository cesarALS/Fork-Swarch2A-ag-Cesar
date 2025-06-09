import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import { todosResolver, createTodo } from './resolvers/todoResolvers.js';
import { groupsResolver } from './resolvers/groupsResolvers.js';
import { dateScalar } from './customScalars.js';

// Here, we define our graphql schema
const typeDefs = `#graphql
  # Comments in GraphQL strings (such as this one) start with the hash (#) symbol.
  
    scalar Date  

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

    type Image {
      data: String!  # Base64
      mimeType: String!    
    }

    type Group {
      id: ID!
      name: String! 
      description: String
      profilePic: Image
      isVerified: Boolean!
      isOpen: Boolean!
      createdAt: Date!
      updatedAt: Date!
    }

    type Query {
      todos: [Todo!]!
      groups: [Group!]!
    }

    type Mutation {
      createTodo(input: NewTodo!): Todo!
    }    
`;

/**
 * We should put all of our resolvers in this object:
 */
const resolvers = {
  Date: dateScalar,
  Query: {
    todos: () => todosResolver(),
    groups: async() => groupsResolver()
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
  listen: { port: 4000 }, // TODO: usar una variable de entorno
});

console.log(`🚀 Server ready at: ${url}`);