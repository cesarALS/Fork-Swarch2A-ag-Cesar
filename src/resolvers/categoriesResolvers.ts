import { UUID } from "node:crypto"
import { fetchMS, URL_TYPES, URLS } from "../fetchMicroservices.js"
import { GraphQLError } from "graphql";
import { ErrorCodes } from "../errorHandling.js";

interface Category {
    id: UUID,
    category: string,
    updated_at: Date,
    created_at: Date
}


export const categoryResolver = async (id: UUID) => {
    const url = `${URLS.CATEGORIES_MS}/${id}`
    const response = await fetchMS<Category>({
        url: url,
        responseType: URL_TYPES.JSON,
        wrapInData: true
    })

    if (response.status != 200) {
        throw new GraphQLError(ErrorCodes.GENERIC_CLIENT_ERROR, {
            extensions: {
                code: ErrorCodes.GENERIC_CLIENT_ERROR,
              },
        });
    }

    const data = response.responseBody.data
    return {
        id: data.id,
        category: data.category,
        updated_at: new Date(data.updated_at),
        created_at: new Date(data.created_at)
    }
}

export const categoriesResolver = async () => {
    const response = await fetchMS<Category[]>({
        url: `${URLS.CATEGORIES_MS}`,
        responseType: URL_TYPES.JSON,
        wrapInData: true
    })

    if (response.status != 200) {
        throw new GraphQLError(ErrorCodes.GENERIC_CLIENT_ERROR, {
            extensions: {
                code: ErrorCodes.GENERIC_CLIENT_ERROR,
              },
        });
    }

    const categories = response.responseBody.data
    const processedResponse = categories.map((cat) => {
        return {
            id: cat.id,
            category: cat.category,
            updated_at: new Date(cat.updated_at),
            created_at: new Date(cat.created_at)
        }
    })

    return processedResponse
}

export const createCategoryResolver = async (category_name: string) => {
    // TODO: fix the way post requests are sent both here and in the categories ms, 
    // because the parameters  should be in the body and not in the url
    const response = await fetchMS<Category>({
        url: `${URLS.CATEGORIES_MS}/?category_name=${category_name}`,
        method: "POST",
        responseType: URL_TYPES.JSON,
        wrapInData: true,
    })

    // TODO: fix the status code in the categories ms and here, because it should be 201 (Created)
    if (response.status != 200) {
        throw new GraphQLError(ErrorCodes.GENERIC_CLIENT_ERROR, {
            extensions: {
                code: ErrorCodes.GENERIC_CLIENT_ERROR,
              },
        });
    }

    const data = response.responseBody.data
    return {
        id: data.id,
        category: data.category,
        updated_at: new Date(data.updated_at),
        created_at: new Date(data.created_at)
    }
}

export const deleteCategory = async (id: UUID) => {
    const response = await fetchMS<null>({
        url: `${URLS.CATEGORIES_MS}/${id}`,
        method: "DELETE"
    })


    // TODO: fix the status code in the categories ms and here, because it should be 204 (No Content)
    if (response.status != 200) {        
        throw new GraphQLError(ErrorCodes.GENERIC_CLIENT_ERROR, {
            extensions: {
                code: ErrorCodes.GENERIC_CLIENT_ERROR,
              },
        });
    }

    return true
}

