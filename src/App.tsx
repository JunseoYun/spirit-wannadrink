import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import MapPage from "./pages/MapPage";
import { authStore } from "./store/auth";
import { reissueToken } from "./api/auth";

function PrivateRoute({ element }: { element: React.ReactElement }) {
  const [status, setStatus] = useState<"loading" | "ok" | "unauthorized">(
    authStore.getAccessToken() ? "ok" : "loading"
  );

  useEffect(() => {
    if (status !== "loading") return;

    const refreshToken = authStore.getRefreshToken();
    if (!refreshToken) {
      setStatus("unauthorized");
      return;
    }

    reissueToken(refreshToken)
      .then((tokens) => {
        authStore.setTokens(tokens.accessToken, tokens.refreshToken);
        setStatus("ok");
      })
      .catch(() => {
        authStore.clear();
        setStatus("unauthorized");
      });
  }, []);

  if (status === "loading") return null;
  if (status === "unauthorized") return <Navigate to="/login" replace />;
  return element;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/map" element={<PrivateRoute element={<MapPage />} />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
