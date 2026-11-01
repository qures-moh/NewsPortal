
import { useCallback, useEffect, useState } from "react";
import {
  Search,
  Eye,
  Trash2,
  UserRoundCheck,
  UserRoundX,
  Users as UsersIcon,
  UserCheck,
  UserX,
  UserPlus,
  X,
  ChevronLeft,
  ChevronRight,
  Mail,
  CalendarDays,
  ShieldCheck,
  Clock,
  LoaderCircle,
  RefreshCw,
} from "lucide-react";

import { toast } from "sonner";
import api from "../../services/api";
import ConfirmModal from "../../components/common/ConfirmModal";
import "./Users.css";

const getImageUrl = (imagePath) => {
  if (!imagePath) return "";

  if (
    imagePath.startsWith("http://") ||
    imagePath.startsWith("https://")
  ) {
    return imagePath;
  }

  const apiUrl = import.meta.env.VITE_API_URL || "";
  const backendUrl = apiUrl.replace(/\/api\/?$/, "").replace(/\/$/, "");

  return `${backendUrl}${imagePath.startsWith("/") ? "" : "/"}${imagePath}`;
};

const formatDate = (date) => {
  if (!date) return "—";

  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatLastLogin = (date) => {
  if (!date) return "Never logged in";

  return new Date(date).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

const getInitials = (name = "") => {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
};

const Users = () => {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    inactiveUsers: 0,
    newUsers: 0,
  });

  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  const [selectedUser, setSelectedUser] = useState(null);
  const [actionLoading, setActionLoading] = useState("");
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    confirmText: "",
    cancelText: "Cancel",
    variant: "primary",
    onConfirm: null,
    isLoading: false,
  });

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);

      const params = {
        page,
        limit: 10,
        search: search.trim() || undefined,
        status: status === "all" ? undefined : status,
      };

      const response = await api.get("/admin/users", { params });

      setUsers(response.data.users || []);
      setPagination(
        response.data.pagination || {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0,
        }
      );
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to fetch users"
      );
    } finally {
      setLoading(false);
    }
  }, [page, search, status]);

  const fetchStats = useCallback(async () => {
    try {
      setStatsLoading(true);

      const response = await api.get("/admin/users/stats");

      setStats(
        response.data.stats || {
          totalUsers: 0,
          activeUsers: 0,
          inactiveUsers: 0,
          newUsers: 0,
        }
      );
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to fetch user statistics"
      );
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Reset pagination when search or filter changes
  useEffect(() => {
    setPage(1);
  }, [search, status]);

  const handleStatusChange = (user) => {
    const nextStatus = !user.isActive;

    setConfirmModal({
      isOpen: true,
      title: `${nextStatus ? "Activate" : "Deactivate"} User`,
      message: `Are you sure you want to ${
        nextStatus ? "activate" : "deactivate"
      } ${user.name}?`,
      confirmText: nextStatus ? "Activate User" : "Deactivate User",
      cancelText: "Cancel",
      variant: nextStatus ? "primary" : "warning",
      isLoading: false,
      onConfirm: async () => {
        try {
          setActionLoading(user._id);
          setConfirmModal((prev) => ({ ...prev, isLoading: true }));

          await api.patch(`/admin/users/${user._id}/status`, {
            isActive: nextStatus,
          });

          toast.success(
            `User ${nextStatus ? "activated" : "deactivated"} successfully`
          );

          await Promise.all([fetchUsers(), fetchStats()]);

          if (selectedUser?._id === user._id) {
            setSelectedUser((previous) =>
              previous ? { ...previous, isActive: nextStatus } : null
            );
          }
        } catch (error) {
          toast.error(
            error.response?.data?.message || "Failed to update user status"
          );
        } finally {
          setActionLoading("");
          setConfirmModal((prev) => ({ ...prev, isOpen: false, isLoading: false }));
        }
      },
    });
  };

  const handleDelete = (user) => {
    setConfirmModal({
      isOpen: true,
      title: "Delete User",
      message: `Are you sure you want to permanently delete ${user.name}? This action cannot be undone.`,
      confirmText: "Delete Permanently",
      cancelText: "Cancel",
      variant: "danger",
      isLoading: false,
      onConfirm: async () => {
        try {
          setActionLoading(user._id);
          setConfirmModal((prev) => ({ ...prev, isLoading: true }));

          await api.delete(`/admin/users/${user._id}`);

          toast.success("User deleted successfully");

          setSelectedUser(null);

          await Promise.all([fetchUsers(), fetchStats()]);
        } catch (error) {
          toast.error(
            error.response?.data?.message || "Failed to delete user"
          );
        } finally {
          setActionLoading("");
          setConfirmModal((prev) => ({ ...prev, isOpen: false, isLoading: false }));
        }
      },
    });
  };

  const handleViewUser = async (user) => {
    try {
      setActionLoading(`view-${user._id}`);

      const response = await api.get(`/admin/users/${user._id}`);

      setSelectedUser(response.data.user);
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to fetch user details"
      );
    } finally {
      setActionLoading("");
    }
  };

  const totalPages = pagination.totalPages || 1;

  return (
    <div className="users-page">
      {/* Page Header */}
      <div className="users-page-header">
        <div>
          <h1>Manage your customers</h1>
          <p>View and manage all registered customers.</p>
        </div>

        <button
          type="button"
          className="users-refresh-btn"
          onClick={() => Promise.all([fetchUsers(), fetchStats()])}
          disabled={loading || statsLoading}
        >
          <RefreshCw size={15} />
          Refresh
        </button>
      </div>

      {/* Statistics */}
      <div className="users-stats-grid">
        <div className="users-stat-card">
          <div className="users-stat-icon total">
            <UsersIcon size={21} />
          </div>
          <div>
            <span>Total Customers</span>
            <h3>{statsLoading ? "—" : stats.totalUsers}</h3>
          </div>
        </div>

        <div className="users-stat-card">
          <div className="users-stat-icon active">
            <UserCheck size={21} />
          </div>
          <div>
            <span>Active Customers</span>
            <h3>{statsLoading ? "—" : stats.activeUsers}</h3>
          </div>
        </div>

        <div className="users-stat-card">
          <div className="users-stat-icon inactive">
            <UserX size={21} />
          </div>
          <div>
            <span>Inactive Customers</span>
            <h3>{statsLoading ? "—" : stats.inactiveUsers}</h3>
          </div>
        </div>

        <div className="users-stat-card">
          <div className="users-stat-icon new">
            <UserPlus size={21} />
          </div>
          <div>
            <span>New Customers (30 days)</span>
            <h3>{statsLoading ? "—" : stats.newUsers}</h3>
          </div>
        </div>
      </div>

      {/* User Table */}
      <div className="users-table-card">
        <div className="users-table-heading">
          <div>
            <h2>All Customers</h2>
            <p>
              Manage your registered customer accounts
            </p>
          </div>

          <span className="users-total-badge">
            {pagination.total} customers
          </span>
        </div>

        {/* Search and Filters */}
        <div className="users-toolbar">
          <div className="users-search-box">
            <Search size={17} />
            <input
              type="search"
              placeholder="Search by name or email..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                aria-label="Clear search"
              >
                <X size={15} />
              </button>
            )}
          </div>

          <select
            className="users-status-filter"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        {/* Table */}
        <div className="users-table-wrapper">
          <table className="users-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Status</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className="users-table-message">
                    <LoaderCircle className="users-spinner" size={24} />
                    <span>Loading customers...</span>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="5" className="users-table-message">
                    <UsersIcon size={30} />
                    <strong>No customers found</strong>
                    <span>Try changing your search or filters.</span>
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user._id}>
                    <td>
                      <div className="users-user-info">
                        {user.avatar ? (
                          <img
                            src={getImageUrl(user.avatar)}
                            alt={user.name}
                            className="users-avatar"
                            onError={(event) => {
                              event.currentTarget.style.display = "none";
                            }}
                          />
                        ) : (
                          <div className="users-avatar-fallback">
                            {getInitials(user.name)}
                          </div>
                        )}

                        <div className="users-user-name">
                          <strong>{user.name}</strong>
                          <span>
                            {user.isEmailVerified
                              ? "Verified account"
                              : "Not verified"}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td>
                      <span className="users-email">{user.email}</span>
                    </td>

                    <td>
                      <span
                        className={`users-status-badge ${
                          user.isActive ? "active" : "inactive"
                        }`}
                      >
                        <span />
                        {user.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>

                    <td>
                      <span className="users-date">
                        {formatDate(user.createdAt)}
                      </span>
                    </td>

                    <td>
                      <div className="users-actions">
                        <button
                          type="button"
                          className="users-action-btn view"
                          title="View details"
                          aria-label={`View ${user.name}`}
                          onClick={() => handleViewUser(user)}
                          disabled={actionLoading === `view-${user._id}`}
                        >
                          {actionLoading === `view-${user._id}` ? (
                            <LoaderCircle size={16} className="users-spinner" />
                          ) : (
                            <Eye size={16} />
                          )}
                        </button>

                        <button
                          type="button"
                          className={`users-action-btn ${
                            user.isActive ? "deactivate" : "activate"
                          }`}
                          title={
                            user.isActive
                              ? "Deactivate user"
                              : "Activate user"
                          }
                          aria-label={
                            user.isActive
                              ? `Deactivate ${user.name}`
                              : `Activate ${user.name}`
                          }
                          onClick={() => handleStatusChange(user)}
                          disabled={actionLoading === user._id}
                        >
                          {user.isActive ? (
                            <UserRoundX size={16} />
                          ) : (
                            <UserRoundCheck size={16} />
                          )}
                        </button>

                        <button
                          type="button"
                          className="users-action-btn delete"
                          title="Delete user"
                          aria-label={`Delete ${user.name}`}
                          onClick={() => handleDelete(user)}
                          disabled={actionLoading === user._id}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="users-pagination">
          <span>
            Showing{" "}
            {pagination.total === 0
              ? 0
              : (pagination.page - 1) * pagination.limit + 1}
            {" - "}
            {Math.min(
              pagination.page * pagination.limit,
              pagination.total
            )}{" "}
            of {pagination.total} customers
          </span>

          <div className="users-pagination-controls">
            <button
              type="button"
              disabled={page <= 1 || loading}
              onClick={() => setPage((previous) => previous - 1)}
              aria-label="Previous page"
            >
              <ChevronLeft size={17} />
            </button>

            <span>
              Page {pagination.page} of {totalPages}
            </span>

            <button
              type="button"
              disabled={page >= totalPages || loading}
              onClick={() => setPage((previous) => previous + 1)}
              aria-label="Next page"
            >
              <ChevronRight size={17} />
            </button>
          </div>
        </div>
      </div>

      {/* User Details Modal */}
      {selectedUser && (
        <div
          className="users-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedUser(null);
            }
          }}
        >
          <div
            className="users-details-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="users-modal-title"
          >
            <div className="users-modal-header">
              <div>
                <h2 id="users-modal-title">Customer Details</h2>
                <p>Complete account information</p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                aria-label="Close details"
              >
                <X size={19} />
              </button>
            </div>

            <div className="users-modal-profile">
              {selectedUser.avatar ? (
                <img
                  src={getImageUrl(selectedUser.avatar)}
                  alt={selectedUser.name}
                  className="users-modal-avatar"
                />
              ) : (
                <div className="users-modal-avatar users-avatar-fallback">
                  {getInitials(selectedUser.name)}
                </div>
              )}

              <h3>{selectedUser.name}</h3>
              <p>{selectedUser.email}</p>

              <span
                className={`users-status-badge ${
                  selectedUser.isActive ? "active" : "inactive"
                }`}
              >
                <span />
                {selectedUser.isActive ? "Active" : "Inactive"}
              </span>
            </div>

            <div className="users-detail-list">
              <div>
                <Mail size={17} />
                <section>
                  <span>Email address</span>
                  <strong>{selectedUser.email}</strong>
                </section>
              </div>

              <div>
                <ShieldCheck size={17} />
                <section>
                  <span>Account role</span>
                  <strong>{selectedUser.role}</strong>
                </section>
              </div>

              <div>
                <UserCheck size={17} />
                <section>
                  <span>Email verification</span>
                  <strong>
                    {selectedUser.isEmailVerified
                      ? "Verified"
                      : "Not verified"}
                  </strong>
                </section>
              </div>

              <div>
                <CalendarDays size={17} />
                <section>
                  <span>Joined date</span>
                  <strong>{formatDate(selectedUser.createdAt)}</strong>
                </section>
              </div>

              <div>
                <Clock size={17} />
                <section>
                  <span>Last login</span>
                  <strong>
                    {formatLastLogin(selectedUser.lastLogin)}
                  </strong>
                </section>
              </div>
            </div>

            <div className="users-modal-footer">
              <button
                type="button"
                className="users-modal-close-btn"
                onClick={() => setSelectedUser(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmModal.isOpen && (
        <ConfirmModal
          isOpen={confirmModal.isOpen}
          title={confirmModal.title}
          message={confirmModal.message}
          confirmText={confirmModal.confirmText}
          cancelText={confirmModal.cancelText}
          variant={confirmModal.variant}
          isLoading={confirmModal.isLoading}
          onConfirm={confirmModal.onConfirm}
          onCancel={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
        />
      )}
    </div>
  );
};

export default Users;
