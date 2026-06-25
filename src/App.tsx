
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AdminBookings from "./pages/AdminBookings";
import AdminPhotos from "./pages/AdminPhotos";
import AdminDesignImages from "./pages/AdminDesignImages";
import AdminCustomGallery from "./pages/AdminCustomGallery";

import DesignPage from "./pages/DesignPage";
import SavedDesignPage from "./pages/SavedDesignPage";


const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider defaultTheme="light">
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/design" element={<DesignPage />} />
            <Route path="/design/saved/:id" element={<SavedDesignPage />} />

            <Route path="/maddhattery-admin" element={<AdminBookings />} />
<Route path="/maddhattery-admin/photos" element={<AdminPhotos />} />
<Route path="/maddhattery-admin/design" element={<AdminDesignImages />} />
<Route path="/maddhattery-admin/custom-gallery" element={<AdminCustomGallery />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
