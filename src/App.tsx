import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Browse from "./pages/Browse.tsx";
import Detail from "./pages/Detail.tsx";
import Edit from "./pages/Edit.tsx";
import Archive from "./pages/Archive.tsx";
import Wednesdays from "./pages/Wednesdays.tsx";
import SnapshotView from "./pages/SnapshotView.tsx";
import PrintView from "./pages/PrintView.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Browse />} />
          <Route path="/archive" element={<Archive />} />
          <Route path="/wednesdays" element={<Wednesdays />} />
          <Route path="/wednesdays/:weekKey" element={<SnapshotView />} />
          <Route path="/print" element={<PrintView />} />
          <Route path="/print/:weekKey" element={<PrintView />} />
          <Route path="/request/new" element={<Edit />} />
          <Route path="/request/:id" element={<Detail />} />
          <Route path="/request/:id/edit" element={<Edit />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
