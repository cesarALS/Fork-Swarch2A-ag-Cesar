/**
 * This file handles the generic logic to fetch the microservices
 */

import { GraphQLError } from "graphql";
import { ErrorCodes } from "./errorHandling.js";

/**
 * The URLS needed to fetch the microservices
 */

export const URLS = {
    GROUPS_MS: process.env.GROUPS_MS ?? "http://mu_groups_ms:8008/api",
    AUTH_MS: process.env.AUTH_MS ?? "http://mu_auth_ms:5000",
};

export enum URL_TYPES {
    JSON = "json",
    JPEG = "jpeg",
    NONE = "none",
}

type BodyType<T> = {
    data?: T;
    status?: string;
    error?: string;
    errors?: string[];
};

type Body =
    | string
    | Blob
    | ArrayBuffer
    | FormData
    | URLSearchParams
    | ReadableStream
    | null
    | undefined;

interface FetchMSParams {
    url: string; // The url to fetch
    responseType?: URL_TYPES; // The type of response (Use URL_TYPES)
    method?: "GET" | "POST" | "PUT" | "DELETE"; // The method (POST, PUT, GET, DELETE, etc.)
    headers?: Headers; // The headers provided
    body?: Body; //The body of the request
}

/**
 * This is a generic function that wraps js fetch(), providing some aditional features
 * @returns The API response already processed
 */
export const fetchMS = async <ExpectedType>(params: FetchMSParams) => {
    const { url, responseType, method, headers, body } = params;

    try {
        const response = await fetch(url, {
            method,
            headers,
            body,
        });

        const status = response.status;

        let responseBody: unknown;
        switch (responseType) {
            case URL_TYPES.JSON:
                responseBody = await response.json();
                break;
            case URL_TYPES.JPEG:
                const arrayBuf = await response.arrayBuffer();
                responseBody = Buffer.from(arrayBuf);
                break;
            case URL_TYPES.NONE:
                responseBody = null;
                break;
            default:
                responseBody = await response.json();
                break;
        }

        return {
            status,
            responseBody: responseBody as BodyType<ExpectedType>,
        };
    } catch (err) {
        let errorString = `error calling the url ${url}:`;
        errorString =
            err instanceof Error
                ? `${errorString} ${err.name}; \n ${err.message}`
                : `${errorString} ${err}`;
        console.error(errorString);

        /**
         * We want to print the error to gateway console, but we do not want to disclose it to the GraphQL API Consumer,
         * for security purposes.
         */
        throw new GraphQLError(ErrorCodes.INTERNAL_SERVER_ERROR, {
            extensions: {
                code: ErrorCodes.INTERNAL_SERVER_ERROR,
            },
        });
    }
};
