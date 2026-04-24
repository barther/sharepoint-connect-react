import {
  PublicClientApplication,
  type Configuration,
  type AccountInfo,
  InteractionRequiredAuthError,
} from "@azure/msal-browser";

// Single-tenant app — see mem://entra/app-registration.md
const TENANT_ID = "a0c55473-8feb-4453-9a3c-cab3de852125";
const CLIENT_ID = "746131b5-f33f-4df8-a4c0-5ccc08ca52c4";

export const GRAPH_SCOPES = ["Sites.ReadWrite.All"];

export const msalConfig: Configuration = {
  auth: {
    clientId: CLIENT_ID,
    authority: `https://login.microsoftonline.com/${TENANT_ID}`,
    redirectUri: window.location.origin,
    postLogoutRedirectUri: window.location.origin,
  },
  cache: {
    cacheLocation: "sessionStorage",
  },
};

export const msalInstance = new PublicClientApplication(msalConfig);

// Silent-then-popup token acquisition for Graph.
export async function acquireGraphToken(account: AccountInfo): Promise<string> {
  try {
    const res = await msalInstance.acquireTokenSilent({
      account,
      scopes: GRAPH_SCOPES,
    });
    return res.accessToken;
  } catch (err) {
    if (err instanceof InteractionRequiredAuthError) {
      const res = await msalInstance.acquireTokenPopup({ scopes: GRAPH_SCOPES });
      return res.accessToken;
    }
    throw err;
  }
}
