import { fetchMS, URLS } from "../fetchMicroservices.js";
import { UUID } from "node:crypto";
import { Image } from "../types.js";
import { GraphQLError } from "graphql";
import { ErrorCodes } from "../errorHandling.js";

export interface CreateUser {
    id: UUID;
    name: string;
    profilePic: Image;
}

interface UserFromAPI {
    id: UUID;
    name: string;
    profilePicUrl: string;
}

export const userResolver = async (id: UUID) => {
    if (!id) {
        console.error("Missing the mandatory id field in the user resolver")
        return
    }

    const response = await fetchMS<UserFromAPI>({
        url: `${URLS.USERS_MS}/api/users/${id}`
    })
    
    if (response.status != 200) {
        throw new GraphQLError(ErrorCodes.GENERIC_CLIENT_ERROR, {
            extensions: {
                code: ErrorCodes.GENERIC_CLIENT_ERROR
            }
        })
    }

    const user = response.responseBody.data
    return {
        id: user.id,
        name: user.name,
        profilePicUrl: user.profilePicUrl
    }
}