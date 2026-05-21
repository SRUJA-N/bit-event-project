import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth";
import { Layout } from "@/components/layout";
import { Login } from "@/pages/auth/login";
import { Register } from "@/pages/auth/register";
import { StudentHome } from "@/pages/student/home";
import { EventDetail } from "@/pages/student/event-detail";
import { MyRegistrations } from "@/pages/student/my-registrations";
import { Feedback } from "@/pages/student/feedback";
import { FacultyDashboard } from "@/pages/faculty/dashboard";
import { CreateEvent } from "@/pages/faculty/create-event";
import { EditEvent } from "@/pages/faculty/edit-event";
import { ReviewRegistrations } from "@/pages/faculty/review-registrations";
import { AdminDashboard } from "@/pages/admin/dashboard";
import { AdminEvents } from "@/pages/admin/events";
import { AdminReports } from "@/pages/admin/reports";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

function ProtectedRoute({ component: Component, allowedRoles }: { component: React.ComponentType<any>, allowedRoles?: string[] }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  if (!user) {
    return <Redirect to="/login" />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Redirect to="/" />;
  }

  return (
    <Layout>
      <Component />
    </Layout>
  );
}

function Router() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  return (
    <Switch>
      <Route path="/login">
        {user ? <Redirect to="/" /> : <Login />}
      </Route>
      <Route path="/register">
        {user ? <Redirect to="/" /> : <Register />}
      </Route>
      
      {/* Student Routes */}
      <Route path="/">
        {!user ? <Redirect to="/login" /> : 
         user.role === 'admin' ? <Redirect to="/admin/dashboard" /> :
         user.role === 'faculty' ? <Redirect to="/faculty/dashboard" /> :
         <Layout><StudentHome /></Layout>}
      </Route>
      
      <Route path="/events/:id" component={() => <ProtectedRoute component={EventDetail} allowedRoles={['student']} />} />
      <Route path="/my-registrations" component={() => <ProtectedRoute component={MyRegistrations} allowedRoles={['student']} />} />
      <Route path="/events/:id/feedback" component={() => <ProtectedRoute component={Feedback} allowedRoles={['student']} />} />
      
      {/* Faculty Routes */}
      <Route path="/faculty/dashboard" component={() => <ProtectedRoute component={FacultyDashboard} allowedRoles={['faculty']} />} />
      <Route path="/faculty/events/new" component={() => <ProtectedRoute component={CreateEvent} allowedRoles={['faculty']} />} />
      <Route path="/faculty/events/:id/edit" component={() => <ProtectedRoute component={EditEvent} allowedRoles={['faculty']} />} />
      <Route path="/faculty/events/:id/registrations" component={() => <ProtectedRoute component={ReviewRegistrations} allowedRoles={['faculty']} />} />
      
      {/* Admin Routes */}
      <Route path="/admin/dashboard" component={() => <ProtectedRoute component={AdminDashboard} allowedRoles={['admin']} />} />
      <Route path="/admin/events" component={() => <ProtectedRoute component={AdminEvents} allowedRoles={['admin']} />} />
      <Route path="/admin/reports" component={() => <ProtectedRoute component={AdminReports} allowedRoles={['admin']} />} />
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
        </AuthProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
