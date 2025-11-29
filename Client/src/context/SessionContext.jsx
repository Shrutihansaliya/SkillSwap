import { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const SessionContext = createContext();

export const SessionProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(""); // global message (optional)

  const navigate = useNavigate();

  // Load session on mount
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const storedToken = localStorage.getItem("token");

    if (!storedUser || !storedToken) {
      navigate("/login", { replace: true });
    } else {
      setUser(JSON.parse(storedUser));
    }

    setLoading(false);
  }, [navigate]);

  // Login
  const handleLogin = (userData, token) => {
    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.setItem("token", token);
    setUser(userData);
    navigate("/dashboard", { replace: true });
  };

  // Logout
  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setUser(null);
    navigate("/login", { replace: true });
  };

  return (
    <SessionContext.Provider
      value={{
        user,
        setUser,
        loading,
        message,
        setMessage,
        handleLogin,
        handleLogout,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => useContext(SessionContext);
