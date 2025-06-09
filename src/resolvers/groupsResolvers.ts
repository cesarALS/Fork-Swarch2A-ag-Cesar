/**
 * This file contains the resolvers needed to use the groups API, exposed by the groups microservice
 */

import { UUID } from "node:crypto";
import { fetchAPI, URL_TYPES, URLS } from "../fetchAPIs.js";

interface Group {
    id: UUID
    name: string 
    description: string
    profilePicUrl: string
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

const getGroups = async () : Promise<Group[]> => {
    
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
                     
    const processedResponse: Group[] = groups.map(grp => {
        return {                
            ...grp,
            createdAt: new Date(grp.createdAt),
            updatedAt: new Date(grp.updatedAt),
        }
    })

    // Just some debugging:
    // const seeImages = async () => {        
    //     for(const grp of processedResponse) {
    //         await getImage(grp.id)            
    //     }
    // }

    // await seeImages();
    
    // console.log(processedResponse)
    return processedResponse;

}

const getImage = async (id: UUID) => {
    const response = await fetchAPI(`${URLS.GROUPS_API}/images/${id}`, URL_TYPES.JPEG)
    console.log(response);
}

/**
 * Resolver for groups type
 * @returns 
 */
export const groupsResolver = async () => {    
    const groups = await getGroups()

    // const returnGroups = groups.map(group)
    return groups;
} 
