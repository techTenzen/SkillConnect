import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "./lib/protected-route";
import { WebSocketProvider } from "./lib/useWebSocket";

import HomePage from "@/pages/home-page";
import LandingPage from "@/pages/landing-page";
import AuthPage from "@/pages/auth-page";
import NotFound from "@/pages/not-found";
import ProfilePage from "@/pages/profile-page";
import ProjectsPage from "@/pages/projects-page";
import ProjectDetailPage from "@/pages/project-detail-page";
import ForumPage from "@/pages/forum-page";
import ChatPage from "@/pages/chat-page";
import DiscussionDetailPage from "@/pages/discussion-detail-page";
import NetworkingPage from "@/pages/networking-page";
import UserProfilePage from "@/pages/user-profile-page";
import ChatNetworkingPage from "@/pages/chat-networking-page";

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <ProtectedRoute path="/dashboard" component={HomePage} />
      <ProtectedRoute path="/profile" component={ProfilePage} />
      <ProtectedRoute path="/projects" component={ProjectsPage} />
      <Route path="/projects/:id">
        {(params) => (
          <ProtectedRoute path="/projects/:id" component={() => <ProjectDetailPage params={params} />} />
        )}
      </Route>
      <ProtectedRoute path="/forum" component={ForumPage} />
      <Route path="/discussions/:id">
        {(params) => (
          <ProtectedRoute path="/discussions/:id" component={() => <DiscussionDetailPage params={params} />} />
        )}
      </Route>
      <ProtectedRoute path="/chat" component={ChatNetworkingPage} />
      <ProtectedRoute path="/networking" component={NetworkingPage} />
      <Route path="/users/:id">
        {(params) => (
          <ProtectedRoute path="/users/:id" component={() => <UserProfilePage />} />
        )}
      </Route>
      <Route path="/auth" component={AuthPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <WebSocketProvider>
          <Router />
          <Toaster />
        </WebSocketProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;