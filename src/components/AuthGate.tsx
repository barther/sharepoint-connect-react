import { useEffect, useState } from "react";
import { useMsal, useIsAuthenticated } from "@azure/msal-react";
import { GRAPH_SCOPES, msalInstance } from "@/lib/msal";
import { Ornament } from "@/components/Ornament";

interface Props {
  children: React.ReactNode;
}

/**
 * Renders children only when an MSAL account is present. Otherwise shows a
 * centered sign-in panel matching the masthead's editorial styling.
 */
export const AuthGate = ({ children }: Props) => {
  const { instance, accounts, inProgress } = useMsal();
  const isAuthed = useIsAuthenticated();
  const [error, setError] = useState<string | null>(null);

  // Make sure the active account is always set for token acquisition.
  useEffect(() => {
    if (accounts.length > 0 && !instance.getActiveAccount()) {
      instance.setActiveAccount(accounts[0]);
    }
  }, [accounts, instance]);

  if (isAuthed) return <>{children}</>;

  const onSignIn = async () => {
    setError(null);
    try {
      const res = await msalInstance.loginPopup({ scopes: GRAPH_SCOPES });
      if (res.account) msalInstance.setActiveAccount(res.account);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Sign-in failed.";
      setError(msg);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center">
        <p className="eyebrow">Lithia Springs Methodist</p>
        <h1 className="font-display mt-3 text-4xl">The Prayer List</h1>
        <Ornament className="mt-6" />
        <p className="font-accent italic text-muted-foreground mt-6 text-lg leading-relaxed">
          Sign in with your church Microsoft 365 account to read and update the list.
        </p>

        <button
          onClick={onSignIn}
          disabled={inProgress !== "none"}
          className="btn-primary mt-8 w-full disabled:opacity-50"
        >
          {inProgress !== "none" ? "Signing in…" : "Sign in with Microsoft"}
        </button>

        {error && (
          <p className="mt-4 font-accent text-sm text-destructive">{error}</p>
        )}
      </div>
    </div>
  );
};
