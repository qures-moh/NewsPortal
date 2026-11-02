
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Newspaper,
  Folder,
  FolderTree,
  Tags,
  Image,
  Megaphone,
  Users,
  Settings,
  X,
} from "lucide-react";

import "./Sidebar.css";

const menuItems = [
  {
    title: "Dashboard",
    path: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "News",
    path: "/news",
    icon: Newspaper,
  },
  {
    title: "Categories",
    path: "/categories",
    icon: Folder,
  },
  {
    title: "Subcategories",
    path: "/subcategories",
    icon: FolderTree,
  },
  {
    title: "Tags",
    path: "/tags",
    icon: Tags,
  },
  {
    title: "Media Library",
    path: "/media",
    icon: Image,
  },
  {
    title: "Advertisements",
    path: "/advertisements",
    icon: Megaphone,
  },

  {
    title: "Settings",
    path: "/settings",
    icon: Settings,
  },
];

const Sidebar = ({ isOpen, onClose }) => {
  return (
    <>
      <div
        className={`sidebar-overlay ${isOpen ? "show" : ""}`}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside className={`admin-sidebar ${isOpen ? "sidebar-open" : ""}`}>
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon">
            <Newspaper size={25} />
          </div>

          <div className="sidebar-brand-text">
            <h2>NewsPortal</h2>
            <span>ADMIN PANEL</span>
          </div>

          <button
            type="button"
            className="sidebar-close"
            onClick={onClose}
            aria-label="Close navigation"
          >
            <X size={21} />
          </button>
        </div>

        <div className="sidebar-menu-label">MENU</div>

        <nav className="sidebar-navigation" aria-label="Main navigation">
          {menuItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === "/dashboard"}
                className={({ isActive }) =>
                  `sidebar-link ${isActive ? "active" : ""}`
                }
                onClick={onClose}
              >
                <Icon size={20} strokeWidth={1.9} />
                <span>{item.title}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-footer-content">
            <span className="sidebar-footer-dot" />
            <span>NewsPortal CMS</span>
          </div>
          <span className="sidebar-version">Admin workspace</span>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
