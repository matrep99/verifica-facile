import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Homepage } from "./pages/Homepage";
import { Dashboard } from "./pages/Dashboard";
import { TestBuilder } from "./pages/TestBuilder";
import { TakeTest } from "./pages/TakeTest";
import { Monitor } from "./pages/Monitor";
import { Grade } from "./pages/Grade";
import { Results } from "./pages/Results";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Homepage />} />
          <Route path="/app" element={<Dashboard />} />
          <Route path="/builder/:testId" element={<TestBuilder />} />
          <Route path="/take/:joinCode" element={<TakeTest />} />
          <Route path="/monitor" element={<Monitor />} />
          <Route path="/grade/:testId" element={<Grade />} />
          <Route path="/results/:testId" element={<Results />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
