// A list of allowed origins for cors policies
// all other requests from anyone else except
// the mentioned origins will be denied

const devOrigins = [
    "http://localhost:3000",
    "http://localhost:81",
    "http://localhost",
];

const prodOrigins = [
    "https://mafia.markaz.network",
    "https://home.markaz.network",
];

export const allowedOrigins = process.env.NODE_ENV === "production"
    ? prodOrigins
    : devOrigins;