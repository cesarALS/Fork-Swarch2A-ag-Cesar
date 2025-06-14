import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import { IncomingMessage, ServerResponse } from 'node:http';
import { signUp, SignUp } from './resolvers/authResolvers.js';
import { todosResolver, createTodo } from './resolvers/todoResolvers.js';
import { CreateGroup, createGroupResolver, groupsResolver } from './resolvers/groupsResolvers.js';
import { dateScalar } from './customScalars.js';

// Here, we define our graphql schema
const typeDefs = `#graphql
  # Comments in GraphQL strings (such as this one) start with the hash (#) symbol.
  
    scalar Date  

    input SignUp {
      email: String!
      password: String!
    }

    type User {
      email: String!
      username: String!
      isSuperUser: Boolean!
    }
    
    type Todo {
      id: ID!
      text: String!
      done: Boolean!
      user: TodoUser!
    }

    type TodoUser {
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

    input ImageInput {
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

    type GroupWithoutImage {
      id: ID!
      name: String! 
      description: String      
      isVerified: Boolean!
      isOpen: Boolean!
      createdAt: Date!
      updatedAt: Date!   
    }

    input NewGroup {
      name: String!
      description: String,
      profilePic: ImageInput,
      isOpen: Boolean!
    }

    type Query {
      todos: [Todo!]!
      groups: [Group!]!
    }

    type Mutation {
      signUp(input: SignUp!): User!
      createTodo(input: NewTodo!): Todo!
      createGroup(input: NewGroup!): GroupWithoutImage!
    }
`;

/**
 * This is our Context Interface. Contexts will be used by various resolvers
 */
export interface Context {
  req: IncomingMessage;
  res: ServerResponse; 
}

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
    signUp:       async (_: any, { input }: { input: SignUp }, context: Context) => {
      return await signUp(input, context)
    },
    createTodo:   (_: any, { input }: { input: { text: string, name: string } }) => {
      return createTodo(input.text, input.name); 
    },
    createGroup:  async ( _: any, { input } : { input : CreateGroup}) => {
      return await createGroupResolver(input);
    },
  },
};

const server = new ApolloServer<Context>({
  typeDefs,
  resolvers,
});

const { url } = await startStandaloneServer(server, {
  listen: { port: 4000 }, // TODO: usar una variable de entorno
  context: async ({req, res}) => ({ req, res }),
});

console.log(`🚀 Server ready at: ${url}`);