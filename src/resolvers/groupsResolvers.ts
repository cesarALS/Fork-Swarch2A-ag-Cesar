/**
 * This file contains the resolvers needed to use the groups API, exposed by the groups microservice
 */

import { UUID } from "node:crypto";
import { fetchAPI, URL_TYPES, URLS } from "../fetchAPIs.js";

interface Group {
    id: UUID
    name: string 
    description: string
    profilePic: {
        data: string
        mimeType: string
    }
    isVerified: boolean
    isOpen: boolean
    createdAt: Date
    updatedAt: Date
}
interface GroupFromAPI {
    id: UUID
    name: string
    description: string
    profilePicUrl: string
    isVerified: boolean
    isOpen: boolean
    createdAt: string
    updatedAt: string  
}

const getImage = async (url: string) => {
    const response = await fetchAPI(url, URL_TYPES.JPEG)
    if(response.status !== 200) {
        console.error(`Could not fetch the API, ${response.status}`);
        return;
    }
    else if (response.err) return;    
    const body = response.body as Buffer;
    return body.toString('base64');    
}

/**
 * Resolver for groups type
 * @returns 
 */
export const groupsResolver = async () => {    
    
    const response = await fetchAPI(`${URLS.GROUPS_API}/groups`)
    if (response.err) return;

    // TODO: include the actual error returned by the server
    if(response.status !== 200) {
        console.error("Could not fetch the API, ", response.status)
        return;
    }    
    
    const body = response.body as {
        data: GroupFromAPI[]
        success: string
    };
    
    const groups = body.data;
                     
    const processedResponse: Group[] = await Promise.all(
        groups.map(async (grp) => {
            return {
            id: grp.id,
            name: grp.description,
            description: grp.description,
            profilePic: {
                data: await getImage(grp.id),
                mimeType: "jpeg",
            },
            isVerified: grp.isVerified,
            isOpen: grp.isOpen,
            createdAt: new Date(grp.createdAt),
            updatedAt: new Date(grp.updatedAt),
            };
        }
    ));
    
    // console.log(processedResponse)
    return processedResponse;
} 
