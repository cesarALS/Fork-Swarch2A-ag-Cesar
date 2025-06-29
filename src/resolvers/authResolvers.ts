import { UUID } from "node:crypto";
import { fetchMS, URL_TYPES, URLS } from "../fetchMicroservices.js";
import { Context } from "../index.js";
import { GraphQLError } from "graphql";
import { ErrorCodes } from "../errorHandling.js";

interface User {
    id: UUID;
    email: string;
    username: string;
    isSuperUser: boolean;
}

export interface SignUp {
    email: string;
    password: string;
}

export interface Login extends SignUp {}

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

/** This is the name of the token to send to the frontend for the JWT Cookie */
const AUTH_TOKEN = "token";

const setCookies = (context: Context, jwt: string) => {
    context.res.setHeader(
        "Set-Cookie",
        `${AUTH_TOKEN}=${jwt}; HttpOnly; Secure; Max-Age=3600`,
    );

    context.res.setHeader("Authorization", `Bearer ${jwt}`);
};

const getJWTHeader = (context: Context): string | undefined => {
    let token: string = undefined;

    token = context.req.headers.cookie?.split(" ")[1] ?? undefined;
    if (!token)
        token = context.req.headers.authorization?.split(" ")[1] ?? undefined;

    return token;
};

/** Sign Up Resolver */
export const signUp = async (data: SignUp, context: Context): Promise<User> => {
    const response = await fetchMS<SignUpResponse>({
        url: `${URLS.AUTH_MS}/signup`,
        responseType: URL_TYPES.JSON,
        method: "POST",
        headers: new Headers({
            "Content-Type": "application/json",
        }),
        body: JSON.stringify(data),
        expectedStatus: 201,
    });

    const signUpResponse = response.responseBody.data;

    setCookies(context, signUpResponse.jwt);

    return {
        id: signUpResponse.id,
        email: data.email,
        username: "Temp Username", // TODO: Call the users ms to resolve this field
        isSuperUser: false,
    };
};

/**Login Resolver */
export const login = async (data: Login, context: Context): Promise<User> => {
    const response = await fetchMS<LoginResponse>({
        url: `${URLS.AUTH_MS}/login`,
        responseType: URL_TYPES.JSON,
        method: "POST",
        headers: new Headers({
            "Content-Type": "application/json",
        }),
        body: JSON.stringify(data),
    });

    const loginResponse = response.responseBody.data;

    setCookies(context, loginResponse.jwt);

    return {
        id: loginResponse.id,
        email: data.email,
        username: "Temp Username", // TODO: Call the users ms to resolve this field
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
