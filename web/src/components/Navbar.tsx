import { useAuth } from "../hooks/useAuth";
import { useRouter } from "./Router";

export function Navbar() {
  const { user, logout } = useAuth();
  const { navigate } = useRouter();

  return (
    <nav class="flex items-center justify-between px-6 py-4 border-b border-[#222] bg-[var(--bg)]/80 backdrop-blur-md sticky top-0 z-50">
      <div class="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
        <span class="text-2xl">▶</span>
        <span class="font-bold text-lg gradient-text">Reels Creator</span>
      </div>

      <div class="flex items-center gap-4">
        {user ? (
          <>
            <button class="btn-primary text-sm" onClick={() => navigate("/create")}>
              + New Reel
            </button>
            <div class="flex items-center gap-3">
              <span class="text-sm text-[var(--text2)]">{(user.name as string) || (user.email as string)}</span>
              <button
                class="text-sm text-[var(--text2)] hover:text-white transition"
                onClick={logout}
              >
                Logout
              </button>
            </div>
          </>
        ) : (
          <>
            <button class="text-sm text-[var(--text2)] hover:text-white transition" onClick={() => navigate("/login")}>
              Login
            </button>
            <button class="btn-primary text-sm" onClick={() => navigate("/register")}>
              Register
            </button>
          </>
        )}
      </div>
    </nav>
  );
}
