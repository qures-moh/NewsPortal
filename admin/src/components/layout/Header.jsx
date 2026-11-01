
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  Menu,
  Search,
  Bell,
  LogOut,
  ChevronDown,
} from "lucide-react";

import { logoutAdmin } from "../../features/auth/authSlice";
import { toast } from "sonner";
import ConfirmModal from "../common/ConfirmModal";
import "./Header.css";

const Header = ({ onMenuClick }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { user } = useSelector((state) => state.auth);

  const [searchValue, setSearchValue] = useState("");
  const [profileOpen, setProfileOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const confirmLogout = async () => {
    try {
      setLoggingOut(true);
      await dispatch(logoutAdmin()).unwrap();

      toast.success("Logged out successfully");
      navigate("/login", { replace: true });
    } catch {
      toast.error("Unable to log out");
    } finally {
      setLoggingOut(false);
      setShowLogoutConfirm(false);
    }
  };

  const handleLogoutClick = () => {
    setProfileOpen(false);
    setShowLogoutConfirm(true);
  };

  const adminName = user?.name || "Admin";
  const adminInitial = adminName.charAt(0).toUpperCase();

  return (
    <header className="admin-header">
      <div className="header-left">
        <button
          type="button"
          className="header-menu-button"
          onClick={onMenuClick}
          aria-label="Toggle sidebar"
        >
          <Menu size={25} />
        </button>
      </div>

      <div className="header-search">
        <Search size={20} />

        <input
          type="search"
          placeholder="Search menu..."
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          aria-label="Search menu"
        />
      </div>

      <div className="header-right">
        <button
          type="button"
          className="header-notification-button"
          aria-label="Notifications"
          title="Notifications"
        >
          <Bell size={21} />
          <span className="notification-indicator" />
        </button>

        <div className="header-profile">
          <button
            type="button"
            className="header-profile-button"
            onClick={() => setProfileOpen((prev) => !prev)}
            aria-expanded={profileOpen}
          >
            <span className="header-avatar">{adminInitial}</span>

            <span className="header-profile-info">
              <strong>{adminName}</strong>
              <small>Administrator</small>
            </span>

            <ChevronDown
              size={16}
              className={`profile-chevron ${profileOpen ? "open" : ""}`}
            />
          </button>

          {profileOpen && (
            <div className="header-profile-dropdown">
              <div className="profile-dropdown-info">
                <strong>{adminName}</strong>
                <span>{user?.email}</span>
              </div>

              <button
                type="button"
                className="profile-logout-button"
                onClick={handleLogoutClick}
              >
                <LogOut size={17} />
                Logout
              </button>
            </div>
          )}
        </div>

        <button
          type="button"
          className="header-logout-button"
          onClick={handleLogoutClick}
        >
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>

      <ConfirmModal
        isOpen={showLogoutConfirm}
        onClose={() => !loggingOut && setShowLogoutConfirm(false)}
        onConfirm={confirmLogout}
        title="Sign Out"
        message="Are you sure you want to log out of the administration panel?"
        confirmText="Yes, Log Out"
        cancelText="Stay logged in"
        variant="warning"
        isLoading={loggingOut}
      />
    </header>
  );
};

export default Header;
