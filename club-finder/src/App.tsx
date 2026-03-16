import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import { AuthProvider } from "@/components/auth/AuthProvider";
import AuthGuard from "@/components/auth/AuthGuard";
import Index from "./pages/Index";
import MapPage from "./pages/MapPage";
import ClubPage from "./pages/ClubPage";
import ProfilePage from "./pages/ProfilePage";
import ProfileSettingsPage from "./pages/ProfileSettingsPage";
import BookingPage from "./pages/BookingPage";
import TournamentsPage from "./pages/TournamentsPage";
import TournamentGameRatingPage from "./pages/TournamentGameRatingPage";
import TournamentDetailsPage from "./pages/TournamentDetailsPage";
import AuthPage from "./pages/AuthPage";
import FaceitCallbackPage from "./pages/FaceitCallbackPage";
import CashbackPage from "./pages/CashbackPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <div className="max-w-[420px] mx-auto relative min-h-screen bg-[#121315] border-x border-[#2F3136]">
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/map" element={<MapPage />} />
              <Route path="/tournaments" element={<TournamentsPage />} />
              <Route path="/tournaments/:gameId" element={<TournamentGameRatingPage />} />
              <Route path="/tournaments/details/:tournamentId" element={<TournamentDetailsPage />} />
              <Route path="/club/:id" element={<ClubPage />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/auth/faceit/callback" element={<FaceitCallbackPage />} />

              <Route
                path="/profile"
                element={
                  <AuthGuard>
                    <ProfilePage />
                  </AuthGuard>
                }
              />
              <Route
                path="/profile/settings"
                element={
                  <AuthGuard>
                    <ProfileSettingsPage />
                  </AuthGuard>
                }
              />
              <Route
                path="/profile/cashback"
                element={
                  <AuthGuard>
                    <CashbackPage />
                  </AuthGuard>
                }
              />
              <Route
                path="/booking"
                element={
                  <AuthGuard>
                    <BookingPage />
                  </AuthGuard>
                }
              />

              <Route path="*" element={<NotFound />} />
            </Routes>
            <BottomNav />
          </div>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
