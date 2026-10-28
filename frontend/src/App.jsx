import { useEffect, useState } from "react";
import { api } from "./api.js";
import Landing from "./pages/Landing.jsx";
import Auth from "./pages/Auth.jsx";
import Workspace from "./pages/Workspace.jsx";

export default function App() {
  const [page, setPage] = useState("landing");   // landing -> auth -> app
  const [user, setUser] = useState(null);
  const [mode, setMode] = useState("signup");

  useEffect(() => {
    if (localStorage.getItem("bs_token")) api.me().then((u) => setUser(u)).catch(() => localStorage.removeItem("bs_token"));
  }, []);

  const start = (m = "signup") => { if (user) setPage("app"); else { setMode(m); setPage("auth"); } };
  const signedIn = ({ token, user }) => { localStorage.setItem("bs_token", token); setUser(user); setPage("app"); };
  const signOut = () => { localStorage.removeItem("bs_token"); setUser(null); setPage("landing"); };

  return (
    <>
      <div className="aurora" aria-hidden="true"><i /><i /><i /><i /></div>
      {page === "landing" && <Landing onStart={start} user={user} />}
      {page === "auth" && <Auth mode={mode} setMode={setMode} onDone={signedIn} onBack={() => setPage("landing")} />}
      {page === "app" && user && <Workspace user={user} onSignOut={signOut} onHome={() => setPage("landing")} />}
    </>
  );
}
