import { UUID } from "node:crypto";
import { fetchAPI, URL_TYPES, URLS } from "../fetchAPIs.js";
import { Context } from "../index.js"
import { GraphQLError } from "graphql";

export interface SignUp {
    email: string
    password: string
};

export interface Login extends SignUp {};

interface SignUpResponse {
    id: UUID
    jwt: string
};

interface LoginResponse extends SignUpResponse {};

interface AuthMeResponse {
    id: UUID
    email: string
    isSuperUser: boolean
};

/** This is the name of the token to send to the frontend for the JWT Cookie */
const AUTH_TOKEN = "token"

const setCookies = (context: Context, jwt: string) => {
    context.res.setHeader(
        "Set-Cookie", 
        `${AUTH_TOKEN}=${jwt}; HttpOnly; Secure; Max-Age=3600`
    );

    context.res.setHeader(
        "Authorization",
        `Bearer ${jwt}`
    );
};

const getJWTHeader = (context: Context): string | undefined => {        

    let token: string = undefined
    
    token = context.req.headers.cookie?.split(' ')[1] ?? undefined;
    if(!token) token = context.req.headers.authorization?.split(' ')[1] ?? undefined;

    return token;
};

/** Sign Up Resolver */
export const signUp = async (data: SignUp, context: Context) => {
    const response = await fetchAPI <SignUpResponse> ({
        url: `${URLS.AUTH_API}/signup`,
        responseType: URL_TYPES.JSON,
        method: "POST",
        headers: new Headers({
            "Content-Type": "application/json"
        }),
        body: JSON.stringify(data)
    });

    if(response.err) return;

    if(response.status !== 201) {
        console.log("Error calling the API:");
        console.error(response.responseBody.errors);
        return;
    }

    const signUpResponse = response.responseBody.data;

    setCookies(context, signUpResponse.jwt);

    return {
        email: data.email,
        username: "Temp Username", // TODO: Call the users ms to resolve this field
        isSuperUser: false,
    };
};

/**Login Resolver */
export const login = async (data: Login, context: Context) => {
    const response = await fetchAPI <LoginResponse> ({
        url: `${URLS.AUTH_API}/login`,
        responseType: URL_TYPES.JSON,
        method: "POST",
        headers: new Headers({
            "Content-Type": "application/json"
        }),
        body: JSON.stringify(data)
    });

    if(response.err) return;

    if(response.status !== 200) {
        console.log("Error calling the API:");
        console.error(response.responseBody.errors);
        return;
    }

    const loginResponse = response.responseBody.data;

    setCookies(context, loginResponse.jwt);

    return {
        email: data.email,
        username: "Temp Username", // TODO: Call the users ms to resolve this field
        isSuperUser: false,
    };    

};

/** AuthMe Resolver */
export const authme = async (context: Context) => {
    const token = getJWTHeader(context);
    if(!token) {
        throw new GraphQLError('Token no encontrado', {
            extensions: {
                code: 'TOKEN_NOT_FOUND',
                http: { status: 401 }
            }
        });
    }
            
    const response = await fetchAPI <AuthMeResponse> ({
        url: `${URLS.AUTH_API}/auth/me`,
        responseType: URL_TYPES.JSON,
        method: "GET",
        headers: new Headers({
            "Authorization": `Bearer ${token}`
        }),
        body: null
    });

    if (response.status !== 200) {
        throw new GraphQLError('Token Inválido', {
            extensions: {
                code: 'INVALID_TOKEN',
                http: { status: 401 }
            }                
        })
    };

    const data = response.responseBody.data;

    return {
        email: data.email,
        username: "Temp Username", // TODO: Call the users ms to resolve this field
        isSuperUser: false,
    };
    
};