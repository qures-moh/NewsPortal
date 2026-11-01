
import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  Newspaper,
  Eye,
  FileText,
  Clock,
  Folder,
  FolderTree,
  Tags,
  Users,
  Plus,
  RefreshCw,
  ArrowUpRight,
  CalendarDays,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { fetchDashboard } from "../../features/dashboard/dashboardSlice";
import "./Dashboard.css";

const formatNumber = (value) =>
  new Intl.NumberFormat("en-IN").format(value || 0);

const getLocalizedText = (value) => {
  if (typeof value === "string") return value;

  return (
    value?.en?.title ||
    value?.en ||
    value?.hi?.title ||
    value?.hi ||
    "—"
  );
};

const getStatusClass = (status) => {
  const statuses = {
    published: "published",
    draft: "draft",
    scheduled: "scheduled",
    archived: "archived",
  };

  return statuses[status] || "default";
};

const Dashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const hasFetched = useRef(false);

  const { stats, recentNews, loading, error } = useSelector(
    (state) => state.dashboard
  );

  const loadDashboard = async (showToast = false) => {
    try {
      await dispatch(fetchDashboard()).unwrap();

      if (showToast) {
        toast.success("Dashboard refreshed successfully");
      }
    } catch (err) {
      if (showToast) {
        toast.error(err || "Unable to refresh dashboard");
      }
    }
  };

  useEffect(() => {
    if (hasFetched.current) return;

    hasFetched.current = true;
    loadDashboard();
  }, []);

  const statCards = [
    {
      title: "Total News",
      value: stats?.totalNews,
      icon: Newspaper,
      color: "purple",
      path: "/news",
    },
    {
      title: "Published News",
      value: stats?.publishedNews,
      icon: FileText,
      color: "green",
      path: "/news",
    },
    {
      title: "Draft News",
      value: stats?.draftNews,
      icon: Clock,
      color: "orange",
      path: "/news",
    },
    {
      title: "Scheduled News",
      value: stats?.scheduledNews,
      icon: CalendarDays,
      color: "blue",
      path: "/news",
    },
    {
      title: "Total Views",
      value: stats?.totalViews,
      icon: Eye,
      color: "pink",
      path: "/news",
    },
    {
      title: "Categories",
      value: stats?.totalCategories,
      icon: Folder,
      color: "indigo",
      path: "/categories",
    },
    {
      title: "Subcategories",
      value: stats?.totalSubcategories,
      icon: FolderTree,
      color: "cyan",
      path: "/subcategories",
    },
    {
      title: "Tags",
      value: stats?.totalTags,
      icon: Tags,
      color: "yellow",
      path: "/tags",
    },
    {
      title: "Users",
      value: stats?.totalUsers,
      icon: Users,
      color: "red",
      path: "/users",
    },
  ];

  const quickActions = [
    {
      title: "Create News",
      description: "Write and publish a new article",
      icon: Plus,
      path: "/news",
    },
    {
      title: "Manage Categories",
      description: "Organize your news categories",
      icon: Folder,
      path: "/categories",
    },
    {
      title: "Manage Advertisements",
      description: "Manage website banner advertisements",
      icon: Newspaper,
      path: "/advertisements",
    },
  ];

  return (
    <div className="dashboard-page">
      <div className="dashboard-heading">
        <div>
          <span className="dashboard-eyebrow">OVERVIEW</span>
          <h1>Dashboard</h1>
          <p>Monitor your news portal's performance and activities.</p>
        </div>

        <button
          className="dashboard-refresh-btn"
          onClick={() => loadDashboard(true)}
          disabled={loading}
        >
          <RefreshCw size={17} className={loading ? "refresh-spinning" : ""} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="dashboard-error">
          <AlertCircle size={19} />
          <span>{error}</span>
          <button onClick={() => loadDashboard()}>Try again</button>
        </div>
      )}

      <div className="dashboard-section-heading">
        <div>
          <h2>Statistics</h2>
          <p>Your portal at a glance</p>
        </div>
      </div>

      <div className="dashboard-stats-grid">
        {statCards.map((card) => {
          const Icon = card.icon;

          return (
            <button
              className="dashboard-stat-card"
              key={card.title}
              onClick={() => navigate(card.path)}
            >
              <div className="stat-card-top">
                <div className={`stat-icon ${card.color}`}>
                  <Icon size={21} />
                </div>
                <ArrowUpRight size={17} className="stat-arrow" />
              </div>

              <div className="stat-card-info">
                <span>{card.title}</span>
                <strong>
                  {loading && !stats ? "..." : formatNumber(card.value)}
                </strong>
              </div>
            </button>
          );
        })}
      </div>

      <div className="dashboard-content-grid">
        <section className="dashboard-panel recent-news-panel">
          <div className="panel-heading">
            <div>
              <h2>Recent News</h2>
              <p>Latest articles added to your portal</p>
            </div>

            <button
              className="panel-link"
              onClick={() => navigate("/news")}
            >
              View all <ArrowUpRight size={16} />
            </button>
          </div>

          {loading && !recentNews.length ? (
            <div className="dashboard-empty">
              Loading recent news...
            </div>
          ) : recentNews.length > 0 ? (
            <div className="recent-news-table-wrapper">
              <table className="recent-news-table">
                <thead>
                  <tr>
                    <th>Article</th>
                    <th>Category</th>
                    <th>Status</th>
                    <th>Views</th>
                  </tr>
                </thead>

                <tbody>
                  {recentNews.map((item) => (
                    <tr key={item._id}>
                      <td>
                        <div className="recent-article-title">
                          {getLocalizedText(item.title)}
                        </div>
                        <span className="recent-article-date">
                          {item.createdAt
                            ? new Date(item.createdAt).toLocaleDateString(
                                "en-IN"
                              )
                            : "—"}
                        </span>
                      </td>

                      <td>{getLocalizedText(item.category?.name)}</td>

                      <td>
                        <span
                          className={`news-status ${getStatusClass(
                            item.status
                          )}`}
                        >
                          {item.status}
                        </span>
                      </td>

                      <td>{formatNumber(item.views)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="dashboard-empty">
              <Newspaper size={30} />
              <h3>No news available</h3>
              <p>Your recently created articles will appear here.</p>
            </div>
          )}
        </section>

        <section className="dashboard-panel quick-actions-panel">
          <div className="panel-heading">
            <div>
              <h2>Quick Actions</h2>
              <p>Frequently used sections</p>
            </div>
          </div>

          <div className="quick-actions-list">
            {quickActions.map((action) => {
              const Icon = action.icon;

              return (
                <button
                  key={action.title}
                  className="quick-action-item"
                  onClick={() => navigate(action.path)}
                >
                  <div className="quick-action-icon">
                    <Icon size={20} />
                  </div>

                  <div className="quick-action-text">
                    <strong>{action.title}</strong>
                    <span>{action.description}</span>
                  </div>

                  <ArrowUpRight size={17} />
                </button>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Dashboard;
