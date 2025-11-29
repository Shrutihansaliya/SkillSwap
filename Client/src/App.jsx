import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
// import { SessionProvider } from "./context/SessionContext";  // ✅
import NotFound from "./pages/NotFound";
// Pages
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./components/Register";
import Dashboard from "./pages/Dashboard";
import ForgotPassword from "./pages/ForgotPassword";
import OtpVerifyForgot from "./pages/OtpVerifyForgot";
import ResetPassword from "./pages/ResetPassword";
import Profile from "./pages/profile";
import AdminDashboard from "./pages/Admin/AdminDashboard.jsx";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Services from "./pages/Services";
import AddSkill from "./pages/AddSkill";
import AddCity from "./pages/Admin/AddCity";


function App() {
  return (
    <Router>
     
      <Routes>
        
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
      

         {/* <Route
          path="/dashboard"
          element={
            <SessionProvider>
              <Dashboard />
            </SessionProvider>
          }
        /> */}
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/otp-verify-forgot" element={<OtpVerifyForgot />} />
        <Route path="/reset-password" element={<ResetPassword />} />
         <Route path="/profile" element={<Profile />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/services" element={<Services />} />
         <Route path="/add-skill" element={<AddSkill />} />
        {/* <Route path="/add-skill/:userId" element={<AddSkill />} /> */}
          {/* Admin pages */}

              {/* ✅ Notifications route */}
        {/* <Route path="/notifications" element={<Notifications />} /> */}
        <Route path="/Admin/*" element={<AdminDashboard />} />
          <Route path="/Admin/add-city" element={<AddCity />} />

       {/* IMPORTANT: catch-all 404 — put LAST */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    
    </Router>
  );
}

export default App;
