import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import axios from "axios";
import { Toaster } from "./components/ui/sonner";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import MainApp from "./pages/MainApp";
import "./App.css";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Auth Context
const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("vistagram_token"));
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState(
    localStorage.getItem("vistagram_theme") || "liquid-glass"
  );

  const axiosInstance = useMemo(
    () =>
      axios.create({
        baseURL: API,
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      }),
    [token]
  );

  useEffect(() => {
    if (token) {
      axiosInstance.defaults.headers.Authorization = `Bearer ${token}`;
    }
  }, [token, axiosInstance]);

  useEffect(() => {
    document.documentElement.setAttribute(
      "data-theme",
      theme === "liquid-glass" ? "" : theme
    );
    localStorage.setItem("vistagram_theme", theme);
  }, [theme]);

  const fetchUser = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const response = await axiosInstance.get("/auth/me");
      setUser(response.data);
      if (response.data.theme) {
        setTheme(response.data.theme);
      }
    } catch (error) {
      logout();
    } finally {
      setLoading(false);
    }
  }, [token, axiosInstance]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const login = async (email, password) => {
    const response = await axiosInstance.post("/auth/login", {
      email,
      password,
    });
    const { token: newToken, user: userData } = response.data;
    localStorage.setItem("vistagram_token", newToken);
    setToken(newToken);
    setUser(userData);
    return userData;
  };

  const signup = async (username, email, password) => {
    const response = await axiosInstance.post("/auth/signup", {
      username,
      email,
      password,
    });
    const { token: newToken, user: userData } = response.data;
    localStorage.setItem("vistagram_token", newToken);
    setToken(newToken);
    setUser(userData);
    return userData;
  };

  const logout = () => {
    localStorage.removeItem("vistagram_token");
    setToken(null);
    setUser(null);
  };

  const updateProfile = async (updates) => {
    const response = await axiosInstance.put("/auth/profile", updates);
    setUser(response.data);
    return response.data;
  };

  const updateTheme = async (newTheme) => {
    setTheme(newTheme);
    if (user) {
      await updateProfile({ theme: newTheme });
    }
  };

  const value = {
    user,
    token,
    loading,
    theme,
    login,
    signup,
    logout,
    updateProfile,
    updateTheme,
    isAuthenticated: !!user,
    axiosInstance,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};

const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[var(--bg-base)]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[var(--accent-primary)] border-t-transparent rounded-full animate-spin" />
          <p className="text-[var(--text-secondary)]">Loading Vistagram...</p>
        </div>
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" />;
};

const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[var(--bg-base)]">
        <div className="w-12 h-12 border-4 border-[var(--accent-primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return !isAuthenticated ? children : <Navigate to="/app" />;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/signup"
        element={
          <PublicRoute>
            <Signup />
          </PublicRoute>
        }
      />
      <Route
        path="/app/*"
        element={
          <PrivateRoute>
            <MainApp />
          </PrivateRoute>
        }
      />
      <Route path="/" element={<Navigate to="/app" replace />} />
      <Route path="*" element={<Navigate to="/app" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: "rgba(20, 20, 20, 0.95)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              color: "#fff",
            },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
