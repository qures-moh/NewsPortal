
import { Navigate, Outlet } from "react-router-dom";
import { useSelector } from "react-redux";

import "./ProtectedRoute.css";

const ProtectedRoute = () => {
  const { isAuthenticated, checkingSession, initialized } = useSelector(
    (state) => state.auth
  );

  if (!initialized || checkingSession) {
    return (
      <div className="auth-loading">
        <div className="auth-loading-spinner" />
        <p>Verifying your session...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
