/**
 * This file contains the resolvers needed to use the groups MS, exposed by the groups microservice
 */
import { UUID } from "node:crypto";
import { Buffer } from "node:buffer";
import { fetchMS, URL_TYPES, URLS } from "../fetchMicroservices.js";
import { Image } from "../types.js";

interface Group {
    id: UUID;
    name: string;
    description: string;
    profilePic: Image;
    isVerified: boolean;
    isOpen: boolean;
    createdAt: Date;
    updatedAt: Date;
}
interface GroupFromAPI {
    id: UUID;
    name: string;
    description: string;
    profilePicUrl: string;
    isVerified: boolean;
    isOpen: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface CreateGroup {
    name: string;
    description?: string;
    profilePic?: Image;
    isOpen: boolean;
}

const getImage = async (url: string) => {
    const response = await fetchMS({ url, responseType: URL_TYPES.JPEG });

    const body = response.responseBody as Buffer;
    return body.toString("base64");
};

/**
 * Resolver for groups type
 * @returns
 */
export const groupsResolver = async () => {
    const response = await fetchMS<GroupFromAPI[]>({
        url: `${URLS.GROUPS_MS}/groups`,
    });

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
        }),
    );

    return processedResponse;
};

/**
 * Resolver for create groups mutation type
 * @returns
 */
export const createGroupResolver = async (group: CreateGroup) => {
    // This is really unlikely to happen here,
    // as the schema has the automatic validation of compulsory fields
    if (!group.name || !group.isOpen) {
        console.error(
            "There are missing compulsory fields in the groups mutation",
        );
        return;
    }

    const formData = new FormData();

    formData.append("name", group.name);

    if (group.description) {
        formData.append("description", group.description);
    }

    let imageBuffer: undefined | Buffer = undefined;
    let imageBlob: undefined | Blob = undefined;

    if (group.profilePic) {
        imageBuffer = Buffer.from(group.profilePic.data, "base64");
        imageBlob = new Blob([imageBuffer], { type: "image/jpeg" });
        formData.append("profilePic", imageBlob, `${group.name}.jpg`);
    }

    formData.append("isOpen", String(group.isOpen));

    const response = await fetchMS<GroupFromAPI>({
        url: `${URLS.GROUPS_MS}/groups`,
        responseType: URL_TYPES.JSON,
        method: "POST",
        headers: new Headers(),
        body: formData,
    });

    const data = response.responseBody.data;
    return {
        id: data.id,
        name: data.name,
        description: data.description,
        isVerified: data.isVerified,
        isOpen: data.isOpen,
        createdAt: new Date(data.createdAt),
        updatedAt: new Date(data.updatedAt),
    };
};