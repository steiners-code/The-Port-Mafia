// import { cookies, headers } from "next/headers";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import axios from "axios";

const HOME_URL = process.env.NEXT_PUBLIC_HOME_URL!;
const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL!;
const FRONTEND_URL = process.env.NEXT_PUBLIC_FRONTEND_URL!;
const REDIRECT_URL = process.env.NEXT_PUBLIC_DEFAULT_REDIRECT_URL!;

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getUrl(path: string, type: "server" | "frontend" = "server") {
  switch (type) {
    case "server":
      return new URL("/api/v1" + path, SERVER_URL).toString();
    case "frontend":
      return new URL(path, FRONTEND_URL).toString();
  }
}

export function getRedirectUrl(searchParams: URLSearchParams): string {
  const redirectTo = searchParams.get("redirectTo");
  if (redirectTo) return redirectTo;

  const envUrl = REDIRECT_URL;
  if (envUrl) return envUrl;

  return "/";
}

export function getLoginUrl(pathname: string): string {
  const loginUrl = new URL("/auth/connect?app=the-port-mafia", HOME_URL);
  loginUrl.searchParams.set("redirectTo", pathname);

  return loginUrl.toString();
}

/**
 * Server-side Axios instance mapped to the internal API Gateway.
 * WARNING: This must ONLY be used in Next.js Server environments.
 */
export const api = axios.create({
  baseURL: SERVER_URL,
  withCredentials: true,
});

/**
 * Server-to-Server Request Interceptor
 * * Intercepts every outgoing request from Next.js to the API Gateway and manually
 * injects the client's real identifying information for Security Fingerprinting.
 * - Extracts 'cf-connecting-ip' (or fallback) for geographic impossibility checks.
 * - Extracts 'user-agent' to detect device hijacking.
 * - Manually reconstructs the 'Cookie' header with the opaque 'refreshToken'
 * so the backend parser picks it up natively.
 */
// api.interceptors.request.use(async (config) => {
//   const headerStore = await headers();
//   const cookieStore = await cookies();

//   const userIp = headerStore.get('cf-connecting-ip') || headerStore.get('x-forwarded-for') || '';
//   const userAgent = headerStore.get('user-agent') || '';

//   const refreshToken = cookieStore.get('refreshToken')?.value;

//   if (userIp) config.headers['x-forwarded-for'] = userIp;
//   if (userAgent) config.headers['user-agent'] = userAgent;

//   if (refreshToken) {
//     const existingCookies = config.headers['Cookie'] || '';
//     config.headers['Cookie'] = existingCookies
//       ? `${existingCookies}; refreshToken=${refreshToken}`
//       : `refreshToken=${refreshToken}`;
//   }

//   return config;
// }, (error) => {
//   return Promise.reject(error);
// });