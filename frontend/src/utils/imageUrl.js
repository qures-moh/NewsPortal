/**
 * Helper to resolve media URLs (images, videos, logos, avatars)
 * Ensures relative paths like '/uploads/images/...' get prepended
 * with backend host URL from VITE_API_URL.
 */
export const getImageUrl = (path, fallback = "") => {
  if (!path) return fallback;

  if (typeof path !== "string") {
    if (typeof path === "object" && path.url) {
      return getImageUrl(path.url, fallback);
    }
    return fallback;
  }

  const trimmed = path.trim();
  if (!trimmed) return fallback;

  // If already absolute URL (http, https, blob, data)
  if (/^(?:https?:|\/\/|data:|blob:)/i.test(trimmed)) {
    return trimmed;
  }

  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
  const backendBase = apiUrl.replace(/\/api\/?$/, "").replace(/\/$/, "");

  const cleanPath = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return `${backendBase}${cleanPath}`;
};

/**
 * Returns a fallback placeholder svg data URI when image fails to load
 */
export const getNewsPlaceholder = (text = "NEWS") => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400" fill="#1c2128">
    <rect width="600" height="400" fill="#111827"/>
    <g fill="#374151">
      <circle cx="300" cy="170" r="50"/>
      <path d="M220 280 C220 230, 380 230, 380 280 Z"/>
    </g>
    <text x="300" y="325" fill="#9ca3af" font-family="system-ui, sans-serif" font-size="22" font-weight="700" text-anchor="middle" letter-spacing="3">${text}</text>
  </svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
};
