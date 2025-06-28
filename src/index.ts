import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";
import { IncomingMessage, ServerResponse } from "node:http";
import {
    authme,
    login,
    Login,
    logout,
    signUp,
    SignUp,
} from "./resolvers/authResolvers.js";
import { todosResolver, createTodo } from "./resolvers/todoResolvers.js";
import {
    CreateGroup,
    createGroupResolver,
    deleteGroupResolver,
    groupResolver,
    groupsResolver,
} from "./resolvers/groupsResolvers.js";
import {
    generateCompaniesResolver,
    generatePeopleResolver,
    exampleCompaniesResolver,
    examplePeopleResolver,
} from "./resolvers/bulkResolver.js";
import { 
  userResolver 
} from "./resolvers/usersResolver.js";
import { dateScalar } from "./customScalars.js";
import { ErrorCodes } from "./errorHandling.js";
import { UUID } from "node:crypto";
import { categoriesResolver, categoryResolver, createCategoryResolver, deleteCategory, updateCategory } from "./resolvers/categoriesResolvers.js";

// Here, we define our graphql schema
const typeDefs = `#graphql
  # Comments in GraphQL strings (such as this one) start with the hash (#) symbol.

    scalar Date

    input SignUp {
      email: String!
      password: String!
    }

    input Login {
      email: String!
      password: String!
    }

    type User {
      id: ID!
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

    type UserProfile {
      id: ID!
      name: String!
      profilePicUrl: String!
    }

    type BulkMessage {
      es: String!
      en: String!
    }

    interface ExampleModel {
      id: ID!
      name: String!
    }

    type Company implements ExampleModel {
      id: ID!
      name: String!
    }

    type Person implements ExampleModel {
      id: ID!
      name: String!
    }


    type CompaniesResult {
      task_id: ID!
      message: BulkMessage!
      result: [Company!] # It can be null when it hasn't been processed
    }

    type PeopleResult {
      task_id: ID!
      message: BulkMessage!
      result: [Person!] # It can be null when it hasn't been processed
    }


    type Category {
      id: ID!
      category: String!
      createdAt: Date!
      updatedAt: Date!
    }


    type Query {
      authme: User!

      todos: [Todo!]!

      groups: [Group!]!
      group(id: ID!): Group!

      user(id: ID!): UserProfile!

      # Bulk Example
      exampleCompanies(id: ID!): CompaniesResult!
      examplePeople(id: ID!): PeopleResult!

      # Categories Microservice
      # Can be null because the category might not be found
      category(id: ID!): Category 
      categories: [Category!]!
    }

    type Mutation {
      # Auth 
      signUp(input: SignUp!): User!
      login(input: Login!): User!
      logout: Boolean!

      # Todos
      createTodo(input: NewTodo!): Todo!

      # Groups microservice
      createGroup(input: NewGroup!): GroupWithoutImage!
      deleteGroup(id: ID!): Boolean!

      # Bulk Example
      generateCompanies: CompaniesResult!
      generatePeople: PeopleResult!

      # Categories Microservice
      createCategory(name: String!): Category!
      # Can be null because the category might not be found
      updateCategory(id: ID!, newName: String!): Category  
      # The boolean is used to indicate success or failure
      deleteCategory(id: ID!): Boolean! 
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
        authme: async (_: any, {}, context: Context) => authme(context),
        todos: () => todosResolver(),
        groups: async () => groupsResolver(),
        group: async (_: any, { id }: { id: UUID }) => groupResolver(id),
        user: async (_: any, { id }: { id: UUID }) => userResolver(id),
        exampleCompanies: async (_: any, { id }: { id: string }) =>
            exampleCompaniesResolver(id),
        examplePeople: async (_: any, { id }: { id: string }) =>
            examplePeopleResolver(id),
        category: async(_: any, { id }: { id: UUID }) => categoryResolver(id),
        categories: async () => categoriesResolver(),
    },
    Mutation: {
        signUp: async (
            _: any,
            { input }: { input: SignUp },
            context: Context,
        ) => {
            return await signUp(input, context);
        },
        login: async (
            _: any,
            { input }: { input: Login },
            context: Context,
        ) => {
            return await login(input, context);
        },
        logout: async (_: any, {}, context: Context) => {
            return await logout(context);
        },
        createTodo: (
            _: any,
            { input }: { input: { text: string; name: string } },
        ) => {
            return createTodo(input.text, input.name);
        },
        createGroup: async (_: any, { input }: { input: CreateGroup }) => {
            return await createGroupResolver(input);
        },
        deleteGroup: async (_: any, { id } : { id: UUID }) => {
          return await deleteGroupResolver(id)
        },
        generateCompanies: async () => generateCompaniesResolver(),
        generatePeople: async () => generatePeopleResolver(),
        createCategory: async (_: any, { name } : { name: string }) => createCategoryResolver(name),
        deleteCategory: async (_: any, { id } : { id: UUID }) => deleteCategory(id),
        updateCategory: async (_: any, { id, newName } : { id: UUID, newName: string}) => updateCategory(id, newName),
    },
};

const server = new ApolloServer<Context>({
    typeDefs,
    resolvers,
    formatError: (error) => {
        return {
            message: error.message,
            path: error.path,
            extensions: {
                code:
                    error.extensions?.code || ErrorCodes.INTERNAL_SERVER_ERROR,
                serviceErrors: error.extensions?.serviceErrors || [],
            },
        };
    },
});

const { url } = await startStandaloneServer(server, {
    listen: { port: 4000 }, // TODO: usar una variable de entorno
    context: async ({ req, res }) => ({ req, res }),
});

console.log(`🚀 Server ready at: ${url}`);
