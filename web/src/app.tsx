import { Route, Switch, BrowserRouter } from "./components/Router";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { Feed } from "./pages/Feed";
import { Upload } from "./pages/Upload";
import { Profile } from "./pages/Profile";
import { Discover } from "./pages/Discover";
import { BottomNav } from "./components/BottomNav";

function AppContent() {
  const { user } = useAuth();

  return (
    <div class="app-container">
      <Switch>
        <Route path="/login" component={Login} />
        <Route path="/register" component={Register} />
        <Route path="/" exact component={Feed} />
        <Route path="/discover" component={Discover} />
        <Route path="/upload" component={Upload} />
        <Route path="/profile" component={() => <Profile userId={user ? Number(user.id) : undefined} />} />
      </Switch>
      <BottomNav />
    </div>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}
