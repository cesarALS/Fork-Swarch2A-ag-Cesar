import { UUID } from "node:crypto";
import { fetchAPI, URL_TYPES, URLS } from "../fetchAPIs.js";
import { Context } from "../index.js"

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