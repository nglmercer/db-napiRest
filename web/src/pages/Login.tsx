import { useState } from "preact/hooks";
import { useAuth } from "../hooks/useAuth";
import { useRouter } from "../components/Router";

export function Login() {
  const { login } = useAuth();
  const { navigate } = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate("/");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div class="flex items-center justify-center min-h-[calc(100vh-73px)] px-4">
      <div class="card w-full max-w-md">
        <h1 class="text-2xl font-bold mb-1 gradient-text">Welcome back</h1>
        <p class="text-[var(--text2)] mb-6 text-sm">Login to your account</p>

        {error && (
          <div class="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg p-3 mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} class="flex flex-col gap-4">
          <div>
            <label class="text-sm text-[var(--text2)] mb-1 block">Email</label>
            <input
              class="input-field"
              type="email"
              placeholder="you@example.com"
              value={email}
              onInput={(e) => setEmail((e.target as HTMLInputElement).value)}
              required
            />
          </div>
          <div>
            <label class="text-sm text-[var(--text2)] mb-1 block">Password</label>
            <input
              class="input-field"
              type="password"
              placeholder="••••••••"
              value={password}
              onInput={(e) => setPassword((e.target as HTMLInputElement).value)}
              required
            />
          </div>
          <button class="btn-primary w-full" type="submit" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p class="text-center text-sm text-[var(--text2)] mt-4">
          Don't have an account?{" "}
          <button class="text-[var(--accent)] hover:underline bg-none border-none cursor-pointer" onClick={() => navigate("/register")}>
            Register
          </button>
        </p>
      </div>
    </div>
  );
}
