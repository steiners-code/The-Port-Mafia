import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

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
  const callbackUrl = new URL("/auth/connect", FRONTEND_URL).toString();

  const loginUrl = new URL("/auth/connect", HOME_URL);
  loginUrl.searchParams.set("app", "the-port-mafia");
  loginUrl.searchParams.set("callbackUrl", callbackUrl);
  loginUrl.searchParams.set("redirectTo", pathname);

  return loginUrl.toString();
}