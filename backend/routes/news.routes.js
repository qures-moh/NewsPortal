
const express = require("express");
const { rateLimit } = require("express-rate-limit");

const newsController = require("../controllers/news.controller");
const { protect } = require("../middlewares/auth.middleware");
const authorize = require("../middlewares/authorize.middleware");

const {
  validateNews,
  validateNewsUpdate,
} = require("../validators/news.validator");

const router = express.Router();

const adminOnly = [protect, authorize("admin")];

const validateNewsId = (req, res, next) => {
  const { id } = req.params;

  if (!/^[a-fA-F0-9]{24}$/.test(id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid news ID",
    });
  }

  next();
};

const validatePublicNewsParams = (req, res, next) => {
  const { language, slug } = req.params;

  if (!["en", "hi"].includes(language)) {
    return res.status(400).json({
      success: false,
      message: "Unsupported language",
    });
  }

  if (
    typeof slug !== "string" ||
    slug.length > 220 ||
    !/^[\p{L}\p{N}]+(?:-[\p{L}\p{N}]+)*$/u.test(slug)
  ) {
    return res.status(400).json({
      success: false,
      message: "Invalid news slug",
    });
  }

  next();
};

const viewRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 30,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many view requests. Please try again later.",
  },
});

// ==============================
// ADMIN ROUTES
// ==============================

router.get(
  "/admin/all",
  ...adminOnly,
  newsController.getAdminNews
);

router.get(
  "/admin/:id",
  ...adminOnly,
  validateNewsId,
  newsController.getAdminNewsById
);

// ==============================
// CREATE / UPDATE / ARCHIVE
// ==============================

router.post(
  "/",
  ...adminOnly,
  validateNews,
  newsController.createNews
);

router.patch(
  "/:id",
  ...adminOnly,
  validateNewsId,
  validateNewsUpdate,
  newsController.updateNews
);

router.patch(
  "/:id/archive",
  ...adminOnly,
  validateNewsId,
  newsController.archiveNews
);

// ==============================
// PUBLIC ROUTES
// ==============================

// Homepage data - must be before parameterized routes
router.get(
  "/homepage",
  newsController.getHomepageData
);

// Increment article views
router.post(
  "/:id/views",
  validateNewsId,
  viewRateLimiter,
  newsController.incrementNewsViews
);

// Get article details by language and slug
router.get(
  "/:language/:slug",
  validatePublicNewsParams,
  newsController.getPublicNewsBySlug
);

// Get public news with filters and pagination
router.get(
  "/",
  newsController.getPublicNews
);

module.exports = router;
