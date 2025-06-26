import { UUID } from "node:crypto"
import { fetchMS, URL_TYPES, URLS } from "../fetchMicroservices.js"
import { GraphQLError } from "graphql";
import { ErrorCodes } from "../errorHandling.js";

// The Dates are in snake case because the backend is in Python and that is the
// convention in the language. However, the getJSONFromCategory function transforms
// it to camelCase and the GraphQL Schema is in camel case too, so this is not a probleme
interface Category {
    id: UUID,
    category: string,
    updated_at: Date,
    created_at: Date
}


function getJSONFromCategory (cat: Category) {
    return {
        id: cat.id,
        category: cat.category,
        updatedAt: new Date(cat.updated_at),
        createdAt: new Date(cat.created_at)
    }
}

export const categoryResolver = async (id: UUID) => {
    const url = `${URLS.CATEGORIES_MS}/${id}`
    const response = await fetchMS<Category>({
        url: url,
        wrapInData: true
    })

    if (response.status != 200) {
        throw new GraphQLError(ErrorCodes.GENERIC_CLIENT_ERROR, {
            extensions: {
                code: ErrorCodes.GENERIC_CLIENT_ERROR,
              },
        });
    }

    const category = response.responseBody.data
    return getJSONFromCategory(category)
}

export const categoriesResolver = async () => {
    const response = await fetchMS<Category[]>({
        url: `${URLS.CATEGORIES_MS}`,
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
    const processedResponse = categories.map((category) => {
        return getJSONFromCategory(category)
    })

    return processedResponse
}

export const createCategoryResolver = async (category_name: string) => {
    const response = await fetchMS<Category>({
        url: `${URLS.CATEGORIES_MS}/`,
        method: "POST",
        body: JSON.stringify({ category: category_name }),
        headers: new Headers({ "Content-Type": "application/json" }),
        wrapInData: true,
    })

    if (response.status != 201) {
        throw new GraphQLError(ErrorCodes.GENERIC_CLIENT_ERROR, {
            extensions: {
                code: ErrorCodes.GENERIC_CLIENT_ERROR,
              },
        });
    }

    const category = response.responseBody.data
    return getJSONFromCategory(category)
}

export const deleteCategory = async (id: UUID) => {
    const response = await fetchMS<null>({
        url: `${URLS.CATEGORIES_MS}/${id}`,
        method: "DELETE",
        responseType: URL_TYPES.NONE
    })

    if (response.status != 204) {        
        throw new GraphQLError(ErrorCodes.GENERIC_CLIENT_ERROR, {
            extensions: {
                code: ErrorCodes.GENERIC_CLIENT_ERROR,
              },
        });
    }

    return true
}


export const updateCategory = async(id: UUID, newName: string) => {
    const response = await fetchMS<Category>({
        url: `${URLS.CATEGORIES_MS}/${id}`,
        method: "PUT",
        body: JSON.stringify({ category: newName }),
        headers: new Headers({ "Content-Type": "application/json" } ),
        wrapInData: true
    })

    if (response.status != 200) {        
        throw new GraphQLError(ErrorCodes.GENERIC_CLIENT_ERROR, {
            extensions: {
                code: ErrorCodes.GENERIC_CLIENT_ERROR,
              },
        });
    }

    const category = response.responseBody.data
    return getJSONFromCategory(category)
}