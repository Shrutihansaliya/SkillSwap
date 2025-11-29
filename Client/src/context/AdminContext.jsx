import { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

// ✅ Create Context
const AdminContext = createContext();

// ✅ Provider Component
export const AdminProvider = ({ children }) => {
  const [activePage, setActivePage] = useState("category");
  const [user, setUser] = useState(null);
  const [message, setMessage] = useState(""); // Global message for alerts/toasts
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  // Load user on mount
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      navigate("/login", { replace: true });
      return;
    }

    const parsedUser = JSON.parse(storedUser);
    setUser(parsedUser);

    if (parsedUser.Role !== "Admin") {
      alert("Access denied. Admins only.");
      navigate("/dashboard", { replace: true });
    }

    setLoading(false);
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login", { replace: true });
  };

  return (
    <AdminContext.Provider
      value={{
        activePage,
        setActivePage,
        user,
        setUser,
        message,
        setMessage,
        loading,
        handleLogout,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
};

// ✅ Custom hook for easy access
export const useAdmin = () => useContext(AdminContext);
