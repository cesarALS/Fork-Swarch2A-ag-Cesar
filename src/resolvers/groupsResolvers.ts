/**
 * This file contains the resolvers needed to use the groups API, exposed by the groups microservice
 */

import { UUID } from "node:crypto";
import { Buffer } from "node:buffer";
import { fetchAPI, URL_TYPES, URLS } from "../fetchAPIs.js";
import { Image } from "../types.js";

interface Group {
    id: UUID
    name: string 
    description: string
    profilePic: Image
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

export interface CreateGroup {
    name: string,
    description?: string,
    profilePic?: Image,
    isOpen: boolean
}

const getImage = async (url: string) => {
    const response = await fetchAPI({url, responseType: URL_TYPES.JPEG})
    if(response.status !== 200) {
        console.error(`Could not fetch the API, ${response.status}`);
        return;
    }
    else if (response.err) return;    
    const body = response.responseBody as Buffer;
    return body.toString('base64');
}

/**
 * Resolver for groups type
 * @returns 
 */
export const groupsResolver = async () => {    
    
    const response = await fetchAPI<GroupFromAPI[]>({url: `${URLS.GROUPS_API}/groups`})
    if (response.err) return;
    
    if(response.status !== 200) {        
        console.error(`API reports an error: ${response.responseBody.error}\nStatus: ${response.status}`);
        return;
    }    
    
    const groups = response.responseBody.data;        
                     
    const processedResponse: Group[] = await Promise.all(
        groups.map(async (grp) => {
            return {
            id: grp.id,
            name: grp.name,
            description: grp.description,
            profilePic: {
                data: await getImage(grp.profilePicUrl),
                mimeType: "jpeg", // TODO: support PNG and WebP formats
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

/**
 * Resolver for create groups mutation type
 * @returns 
 */
export const createGroupResolver = async (group: CreateGroup) => {    
    
    if (!group.name || !group.isOpen) {
        throw Error("There are missing compulsory fields in the groups mutation");
    }
    
    const formData = new FormData();

    formData.append('name', group.name);

    if(group.description) {
        formData.append('description', group.description);
    }

    let imageBuffer: undefined | Buffer = undefined;
    let imageBlob: undefined | Blob = undefined;
    
    if(group.profilePic) {
        imageBuffer = Buffer.from(group.profilePic.data);
        imageBlob = new Blob([imageBuffer], { type: 'image/jpeg' });
        formData.append('profilePic', imageBlob, `${group.name}.jpg`);         
    }

    formData.append('isOpen', String(group.isOpen));        

    const response = await fetchAPI<GroupFromAPI[]>({
        url: `${URLS.GROUPS_API}/groups`,
        responseType: URL_TYPES.JSON,
        method: "POST",
        headers: new Headers(),
        body: formData,
    });
    
    if(response.status !== 200) {        
        console.error(`Could not fetch the API: ${response.responseBody.error}`);
        return;
    }

    return response.responseBody.data;

}