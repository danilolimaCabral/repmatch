export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Returns the login page URL for this app (own auth, no OAuth)
export const getLoginUrl = (_returnPath?: string) => "/login";
