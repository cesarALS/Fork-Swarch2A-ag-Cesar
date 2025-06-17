/**
 * This file contains the resolvers for bulk operations
 * exposed by the Bulk microservice
 */

import { fetchMS, URL_TYPES, URLS } from "../fetchMicroservices.js";
import { GraphQLError } from "graphql";
import { ErrorCodes } from "../errorHandling.js";

interface BulkMessage {
    es: string;
    en: string;
}

interface ExampleModel {
    id: string;
    name: string;
}

interface Company extends ExampleModel {}
interface Person extends ExampleModel {}

interface BulkResult<T extends ExampleModel> {
    task_id: string;
    message: BulkMessage;
    result?: {[entity: string]: T[]};
}

interface BulkResponse<T extends ExampleModel> {
    task_id: string;
    message: BulkMessage;
    result?: T[];
};

const BULK_MS = URLS.BULK_MS;

/**
 * Resolver for generating companies in bulk
 */
export const generateCompaniesResolver = async () => {
    return createExampleTask("companies");
};

/**
 * Resolver for generating people in bulk
 */
export const generatePeopleResolver = async () => {
    return createExampleTask("people");
};

/**
 * Resolver for querying companies by task ID
 */
export const exampleCompaniesResolver = async (
    id: string,
): Promise<BulkResponse<Company>> => {
    const response = await getTaskResult<Company>(id);
    return {
        ... response,
        result: response.result.companies,
    };
};

/**
 * Resolver for querying people by task ID
 */
export const examplePeopleResolver = async (
    id: string,
): Promise<BulkResponse<Person>> => {
    const response = await getTaskResult<Person>(id);
    return {
        ... response,
        result: response.result.people,
    };
};

async function createExampleTask<C extends Company>(
    type: "companies",
): Promise<BulkResult<C>>;
async function createExampleTask<P extends Person>(
    type: "people",
): Promise<BulkResult<P>>;
async function createExampleTask<T extends ExampleModel>(
    type: "companies" | "people",
): Promise<BulkResult<T>> {
    const response = await fetchMS<BulkResult<T>>({
        method: "GET",
        url: `${BULK_MS}/examples/${type}/`,
        wrapInData: true,
    });

    if (response.status !== 202) {
        throw new GraphQLError(ErrorCodes.GENERIC_CLIENT_ERROR, {
            extensions: {
                code: ErrorCodes.GENERIC_CLIENT_ERROR,
            },
        });
    }

    return response.responseBody.data;
}

async function getTaskResult<C extends Company>(
    taskID: string,
): Promise<BulkResult<C>>;
async function getTaskResult<P extends Person>(
    taskID: string,
): Promise<BulkResult<P>>;
async function getTaskResult<T extends ExampleModel>(
    taskID: string,
): Promise<BulkResult<T>> {
    // Convert the id into a search param and add it into the URL
    const params = new URLSearchParams({ task_id: taskID }).toString();
    const url = `${BULK_MS}/tasks/status?${params}`;

    const response = await fetchMS<BulkResult<T>>({
        method: "GET",
        url,
        wrapInData: true,
    });

    if (response.status !== 200) {
        throw new GraphQLError(ErrorCodes.GENERIC_CLIENT_ERROR, {
            extensions: {
                code: ErrorCodes.GENERIC_CLIENT_ERROR,
            },
        });
    }

    console.dir(response.responseBody.data);

    return response.responseBody.data;
}
