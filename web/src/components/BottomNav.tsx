import { useRouter } from "./Router";
import { useAuth } from "../hooks/useAuth";

export function BottomNav() {
  const { navigate, path } = useRouter();
  const { user } = useAuth();

  const isActive = (route: string) => path === route;

  return (
    <nav class="bottom-nav">
      <button 
        class={`nav-item ${isActive("/") ? "active" : ""}`}
        onClick={() => navigate("/")}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
          <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
        </svg>
        <span>Home</span>
      </button>

      <button 
        class={`nav-item ${isActive("/discover") ? "active" : ""}`}
        onClick={() => navigate("/discover")}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
          <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
        </svg>
        <span>Discover</span>
      </button>

      <button 
        class="nav-item create-btn"
        onClick={() => navigate("/upload")}
      >
        <div class="create-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
          </svg>
        </div>
      </button>

      <button 
        class={`nav-item ${isActive("/profile") ? "active" : ""}`}
        onClick={() => user ? navigate("/profile") : navigate("/login")}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
        </svg>
        <span>Profile</span>
      </button>
    </nav>
  );
}
