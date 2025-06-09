/**
 * This file handles the generic logic to fetch the APIs 
 */

/**
 * The URLS needed to fetch the microservices
 */
export const URLS = {
    GROUPS_API: process.env.GROUPS_API ?? "http://mu_groups_ms:8008/api"
}

export enum URL_TYPES {
    JSON = "json",
    JPEG = "jpeg"
}

/**
 * This is a generic function that wraps js fetch(), providing some aditional features
 * @param url       The url to fetch the 
 * @param method    The method (POST, PUT, GET, DELETE, etc.)
 * @param headers   The headers provided
 * @returns 
 */
export const fetchAPI = async (
    url: string, 
    responseType: URL_TYPES = URL_TYPES.JSON, 
    method?: string, 
    headers?: Headers
) => {
    
    try {
        
        const response = await fetch(url, {
            method: method,
            headers: headers
        })

        const status = response.status;

        let body: unknown
        switch (responseType){
            case (URL_TYPES.JSON):
                body = await response.json();
                break;
            case (URL_TYPES.JPEG):
                const arrayBuf = await response.arrayBuffer();
                body = Buffer.from(arrayBuf);
                break;
        }

        return {
            status,
            body,
            err: false
        }
        
    } catch (err) {
        
        let errorString = `error calling the url ${url}:`                
        errorString = (err instanceof Error) ? `${errorString} ${err.name}; \n ${err.message}` : `${errorString} ${err}`        
        console.error(errorString)
        
        return {
            status: undefined,
            body: undefined,
            err: true
        }
    }
}