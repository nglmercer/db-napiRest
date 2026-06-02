import { createContext } from "preact";
import { useContext, useState } from "preact/hooks";
import type { JSX } from "preact";

interface RouterContextValue {
  path: string;
  navigate: (to: string) => void;
}

const RouterContext = createContext<RouterContextValue | null>(null);

function parsePath(path: string) {
  return path.replace(/\/#\/?/, "/").replace(/\/$/, "") || "/";
}

export function BrowserRouter({ children }: { children: preact.ComponentChildren }) {
  const [path, setPath] = useState(() => parsePath(window.location.hash.slice(1) || "/"));

  useEffect(() => {
    const onHash = () => setPath(parsePath(window.location.hash.slice(1) || "/"));
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const navigate = (to: string) => {
    window.location.hash = to;
  };

  return (
    <RouterContext.Provider value={{ path, navigate }}>
      {children}
    </RouterContext.Provider>
  );
}

import { useEffect } from "preact/hooks";

export function useRouter() {
  const ctx = useContext(RouterContext);
  if (!ctx) throw new Error("useRouter must be used within BrowserRouter");
  return ctx;
}

interface RouteProps {
  path: string;
  component?: () => JSX.Element;
  children?: preact.ComponentChildren;
  exact?: boolean;
}

export function Route({ path, component, children, exact }: RouteProps) {
  const { path: currentPath } = useRouter();
  const match = exact ? currentPath === path : currentPath.startsWith(path);
  if (!match) return null;
  if (component) {
    const Component = component;
    return <Component />;
  }
  return <>{children}</>;
}

export function Switch({ children }: { children: preact.ComponentChildren }) {
  const { path } = useRouter();
  let matched: preact.ComponentChildren = null;
  for (const child of Array.isArray(children) ? children : [children]) {
    if (child && (child as any).props) {
      const props = (child as any).props as RouteProps;
      const match = props.exact ? path === props.path : path.startsWith(props.path);
      if (match) {
        matched = child;
        break;
      }
    }
  }
  return <>{matched}</>;
}

export { RouterContext };
