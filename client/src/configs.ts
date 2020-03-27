declare global {
    interface Window { env?: {serverUrl?: string}; }
}

export const SERVER_BASE_URL = (window.env && window.env.serverUrl) || window.location.origin;
