import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { MsalProvider, useMsal } from "@azure/msal-react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { msalInstance } from "@/lib/msal";
import { AuthGate } from "@/components/AuthGate";
import { usePrayerStore } from "@/lib/prayer-store";
import Browse from "./pages/Browse.tsx";
import Detail from "./pages/Detail.tsx";
import Edit from "./pages/Edit.tsx";
import Archive from "./pages/Archive.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const SignedInBoot = ({ children }: { children: React.ReactNode }) => {
  const { accounts } = useMsal();
  const setIdentity = usePrayerStore((s) => s.setIdentity);
  const load = usePrayerStore((s) => s.load);
  const loaded = usePrayerStore((s) => s.loaded);

  useEffect(() => {
    const a = accounts[0];
    if (!a) return;
    setIdentity(a.name ?? a.username, a.username);
    if (!loaded) {
      load().catch(() => {
        /* surfaced via store.error */
      });
    }
  }, [accounts, setIdentity, load, loaded]);

  return <>{children}</>;
};

const App = () => (
  <MsalProvider instance={msalInstance}>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthGate>
            <SignedInBoot>
              <Routes>
                <Route path="/" element={<Browse />} />
                <Route path="/archive" element={<Archive />} />
                <Route path="/request/new" element={<Edit />} />
                <Route path="/request/:id" element={<Detail />} />
                <Route path="/request/:id/edit" element={<Edit />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </SignedInBoot>
          </AuthGate>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </MsalProvider>
);

export default App;
