import {
  PublicClientApplication,
  type Configuration,
  type AccountInfo,
  InteractionRequiredAuthError,
  EventType,
} from "@azure/msal-browser";

// Single-tenant app — see mem://entra/app-registration.md
const TENANT_ID = "a0c55473-8feb-4453-9a3c-cab3de852125";
const CLIENT_ID = "746131b5-f33f-4df8-a4c0-5ccc08ca52c4";
const POPUP_REDIRECT_URI = `${window.location.origin}/auth-popup.html`;

export const GRAPH_SCOPES = ["Sites.ReadWrite.All"];

export const msalConfig: Configuration = {
  auth: {
    clientId: CLIENT_ID,
    authority: `https://login.microsoftonline.com/${TENANT_ID}`,
    // For popup flows, redirect to a lightweight static page so the React app
    // does not boot inside the popup and interfere with MSAL's response hash.
    redirectUri: POPUP_REDIRECT_URI,
    postLogoutRedirectUri: window.location.origin,
  },
  cache: {
    // Persist auth/session state across tab closes and browser restarts.
    // Note: `storeAuthStateInCookie` was removed in @azure/msal-browser v5.
    cacheLocation: "localStorage",
  },
};

export const msalInstance = new PublicClientApplication(msalConfig);

// Promise that resolves once MSAL is initialized and any pending redirect has
// been processed. Must be awaited before rendering anything that uses MSAL.
export const msalReady: Promise<void> = (async () => {
  await msalInstance.initialize();

  // If we just came back from a redirect-flow login, this picks up the result.
  const redirectResult = await msalInstance.handleRedirectPromise();
  if (redirectResult?.account) {
    msalInstance.setActiveAccount(redirectResult.account);
  }

  // Make sure an active account is set whenever accounts exist (cache restore).
  if (!msalInstance.getActiveAccount()) {
    const all = msalInstance.getAllAccounts();
    if (all.length > 0) msalInstance.setActiveAccount(all[0]);
  }

  // Keep the active account in sync as logins/logouts happen.
  msalInstance.addEventCallback((event) => {
    if (
      (event.eventType === EventType.LOGIN_SUCCESS ||
        event.eventType === EventType.ACQUIRE_TOKEN_SUCCESS) &&
      event.payload &&
      "account" in event.payload &&
      event.payload.account
    ) {
      msalInstance.setActiveAccount(event.payload.account as AccountInfo);
    }
  });
})();

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
