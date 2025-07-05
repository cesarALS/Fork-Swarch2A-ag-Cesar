import { UUID } from "node:crypto";
import { fetchMS, unwrappedFetchMS, URL_TYPES, URLS } from "../fetchMicroservices.js";
import { Context } from "../index.js";
import { GraphQLError } from "graphql";
import { ErrorCodes } from "../errorHandling.js";

interface User {
    id: UUID;
    email: string;
    username: string;
    isSuperUser: boolean;
}

export interface Login {
    email: string;
    password: string;
}

export interface SignUp extends Login {
    username: string;
}

interface SignUpResponse {
    id: UUID;
    jwt: string;
}

interface LoginResponse extends SignUpResponse {}

interface AuthMeResponse {
    id: UUID;
    email: string;
    isSuperUser: boolean;
}
interface CreateUserResponse {
    id: UUID;
    username: string;
}

interface GetUserResponse extends CreateUserResponse {
    profilePicUrl: string;
}

const setHeaders = (context: Context, jwt: string) => {

    context.res.setHeader("Authorization", `Bearer ${jwt}`);
};

const getJWTHeader = (context: Context): string | undefined => {
    let token: string = undefined;

    token = context.req.headers.authorization?.split(" ")[1] ?? undefined;

    return token;
};

/** Sign Up Resolver */
export const signUp = async (data: SignUp, context: Context): Promise<User> | null => {
    const authResponse = await fetchMS<SignUpResponse>({
        url: `${URLS.AUTH_MS}/signup`,
        method: "POST",
        headers: new Headers({
            "Content-Type": "application/json",
        }),
        body: JSON.stringify(data),
        expectedStatus: 201,
    });

    const id = authResponse.responseBody.data.id;
    const jwt = authResponse.responseBody.data.jwt

    try {
        const userMSBody = {
            id: id,
            username: data.username
        }
        const userMSResponse = await fetchMS<CreateUserResponse>({
            url: `${URLS.USERS_MS}/`,
            method: "POST",
            headers: new Headers({
                "Content-Type": "application/json"
            }),
            body: JSON.stringify(userMSBody),
            expectedStatus: 201
        })

        setHeaders(context, jwt);

        return {
            id: id,
            email: data.email,
            username: userMSResponse.responseBody.data.username, 
            isSuperUser: false
        };
    } catch (err) {
        console.log("Error:", err)
        try {
            // Rollback the creation of the user in the auth database. This operation requires
            // a JWT in the Authorization header to carry out
            await fetchMS<null>({
                url: `${URLS.AUTH_MS}/auth/delete`,
                method: "DELETE",
                headers: new Headers({
                    "Authorization": `Bearer ${jwt}`
                }),
                responseType: URL_TYPES.NONE,
                expectedStatus: 204
            })
            console.log(`Successfully rolled back the creation of user with id ${id} in the auth database`)
        } catch (err) {
            console.log("Error:", err)
            console.log(`User with id ${id} was created in the auth database but not in the user_ms database`)
            console.log("The operation couldn't be rolled back and the databases are now in an inconsistent state")
            console.log("💀")
            throw new GraphQLError(ErrorCodes.INTERNAL_SERVER_ERROR, {
                extensions: {
                    code: ErrorCodes.INTERNAL_SERVER_ERROR
                }
            })
        }
    }
};

/**Login Resolver */
export const login = async (data: Login, context: Context): Promise<User> => {
    const response = await fetchMS<LoginResponse>({
        url: `${URLS.AUTH_MS}/login`,
        method: "POST",
        headers: new Headers({
            "Content-Type": "application/json",
        }),
        body: JSON.stringify(data),
    });

    const loginResponse = response.responseBody.data;
    const id = loginResponse.id
    setHeaders(context, loginResponse.jwt);

    // We use unwrappedFetchMS to handle the error ourselves.
    // If we can't fetch the username then allow the login, but with degraded functionality (no username displayed)
    let username = ""
    try {
        const userMSResponse = await unwrappedFetchMS<GetUserResponse>({
            url: `${URLS.USERS_MS}/${id}` 
        })
        const userMSStatus = userMSResponse.status
        if (userMSStatus == 200) {
            username = userMSResponse.responseBody.data.username
        }
    } catch (err) {
        console.log(`Couldn't fetch the username of user with id ${id}`)
        console.log("Error:", err)
    }
    
    return {
        id: id,
        email: data.email,
        username: username, 
        isSuperUser: false,
    };
};

/** AuthMe Resolver */
export const authme = async (context: Context): Promise<User> => {
    const token = getJWTHeader(context);
    if (!token) {
        throw new GraphQLError("Token no encontrado", {
            extensions: {
                code: "TOKEN_NOT_FOUND",
            },
        });
    }

    const response = await fetchMS<AuthMeResponse>({
        url: `${URLS.AUTH_MS}/auth/me`,
        responseType: URL_TYPES.JSON,
        method: "GET",
        headers: new Headers({
            Authorization: `Bearer ${token}`,
        }),
        body: null,
    });

    if (response.status === 401) {
        throw new GraphQLError(ErrorCodes.INVALID_AUTH_TOKEN, {
            extensions: {
                code: ErrorCodes.INVALID_AUTH_TOKEN,
            },
        });
    }

    const data = response.responseBody.data;

    return {
        id: data.id,
        email: data.email,
        username: "Temp Username", // TODO: Call the users ms to resolve this field
        isSuperUser: false,
    };
};

/** Logout Controller */
export const logout = async (context: Context): Promise<Boolean> => {
    const token = getJWTHeader(context);
    if (!token) {
        throw new GraphQLError("Token no encontrado", {
            extensions: {
                code: "TOKEN_NOT_FOUND",
            },
        });
    }

    const response = await fetchMS<null>({
        url: `${URLS.AUTH_MS}/logout`,
        responseType: URL_TYPES.NONE,
        method: "POST",
        headers: new Headers({
            Authorization: `Bearer ${token}`,
        }),
        body: null,
        expectedStatus: 204
    });

    if (response.status === 401) {
        throw new GraphQLError(ErrorCodes.INVALID_AUTH_TOKEN, {
            extensions: {
                code: ErrorCodes.INVALID_AUTH_TOKEN,
            },
        });
    } 

    return true;
};
