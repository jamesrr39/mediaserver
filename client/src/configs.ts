declare global {
    interface Window { env: {serverUrl: string}; }
}

// TODO: fix
export const SERVER_BASE_URL = (window.env.serverUrl && window.env.serverUrl !== '%REACT_APP_SERVER_URL%')
  ? window.env.serverUrl : '';
