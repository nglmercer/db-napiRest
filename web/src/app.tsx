import { Route, Switch, BrowserRouter } from "./components/Router";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { Reels } from "./pages/Reels";
import { CreateReel } from "./pages/CreateReel";
import { Navbar } from "./components/Navbar";

function ProtectedRoute({ children }: { children: preact.ComponentChildren }) {
  const { user, loading } = useAuth();
  if (loading) return <div class="flex items-center justify-center min-h-screen"><div class="animate-spin w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full" /></div>;
  if (!user) return <Login />;
  return <>{children}</>;
}

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div class="min-h-screen">
          <Navbar />
          <Switch>
            <Route path="/login" component={Login} />
            <Route path="/register" component={Register} />
            <Route path="/" exact>
              <ProtectedRoute>
                <Reels />
              </ProtectedRoute>
            </Route>
            <Route path="/create">
              <ProtectedRoute>
                <CreateReel />
              </ProtectedRoute>
            </Route>
          </Switch>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}
