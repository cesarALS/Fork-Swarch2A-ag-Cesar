/**
 * This file handles the generic logic to fetch the APIs 
 */

/**
 * The URLS needed to fetch the microservices
 */
export const URLS = {
    GROUPS_API: process.env.GROUPS_API ?? "http://mu_groups_ms:8008/api",
    AUTH_API: process.env.AUTH_API ?? "http://mu_auth_ms:5000"
}

export enum URL_TYPES {
    JSON = "json",
    JPEG = "jpeg"
}

type BodyType <T> = {
    data?: T,
    status?: string,
    error?: string,
}

type Body = string | Blob | ArrayBuffer | FormData | URLSearchParams | ReadableStream | null | undefined;

interface FetchAPIParams {
    url: string                                 // The url to fetch
    responseType?: URL_TYPES                    // The type of response (Use URL_TYPES)
    method?: "GET" | "POST" | "PUT" | "DELETE"  // The method (POST, PUT, GET, DELETE, etc.)
    headers?: Headers                           // The headers provided
    body?: Body                                 //The body of the request
}

/**
 * This is a generic function that wraps js fetch(), providing some aditional features
 * @returns             The API response already processed
 */
export const fetchAPI = async <ExpectedType>(
    params: FetchAPIParams
) => {
    
    const { url, responseType, method, headers, body } = params;
    
    try {                

        const response = await fetch(url, {
            method: method,
            headers: headers,
            body: body,
        })

        const status = response.status;

        let responseBody: unknown
        switch (responseType){
            case (URL_TYPES.JSON):
                responseBody = await response.json();
                break;
            case (URL_TYPES.JPEG):
                const arrayBuf = await response.arrayBuffer();
                responseBody = Buffer.from(arrayBuf);
                break;
            default:
                responseBody = await response.json();
                break;                
        }

        return {
            status,
            responseBody: responseBody as BodyType<ExpectedType>,
            err: false
        }
        
    } catch (err) {
        
        let errorString = `error calling the url ${url}:`                
        errorString = (err instanceof Error) ? `${errorString} ${err.name}; \n ${err.message}` : `${errorString} ${err}`        
        console.error(errorString)
        
        return {
            status: undefined,
            responseBody: undefined,
            err: true
        }
    }
}