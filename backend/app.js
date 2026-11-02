
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const path = require("path");

const env = require("./config/env");

const notFound = require("./middlewares/notFound");
const errorHandler = require("./middlewares/errorHandler");
const requestLogger = require("./middlewares/requestLogger");

const authRouter = require("./routes/auth.routes");
const newsRouter = require("./routes/news.routes");
const categoryRouter = require("./routes/category.routes");
const subcategoryRouter = require("./routes/subcategory.routes");
const mediaRouter = require("./routes/media.routes");
const tagRouter = require("./routes/tag.routes");
const settingsRouter = require("./routes/settings.routes");
const advertisementRouter = require("./routes/advertisement.routes");
const dashboardRoutes = require("./routes/dashboard.routes");
const adminUserRouter = require("./routes/adminUser.routes");
const ttsRouter = require("./routes/tts.routes");
const app = express();

const allowedOrigins = [
  env.CLIENT_URL,
  env.ADMIN_URL,
].filter(Boolean);

app.use(helmet());

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      const error = new Error("Origin not allowed by CORS");
      error.statusCode = 403;

      return callback(error);
    },
  })
);

app.use(compression());

app.use(express.json({ limit: "1mb" }));

app.use(
  express.urlencoded({
    extended: true,
    limit: "1mb",
  })
);

app.use(requestLogger);

app.get("/api/health", (req, res) => {
  return res.status(200).json({
    success: true,
    message: "News Portal API is running",
    data: {
      status: "healthy",
      timestamp: new Date().toISOString(),
    },
  });
});

app.use("/api/auth", authRouter);
app.use("/api/news", newsRouter);
app.use("/api/categories", categoryRouter);
app.use("/api/subcategories", subcategoryRouter);
app.use("/api/media", mediaRouter);
app.use("/api/tags", tagRouter);
app.use("/api/settings", settingsRouter);
app.use("/api/advertisements", advertisementRouter);

app.use("/api/admin", dashboardRoutes);
app.use("/api/admin/users", adminUserRouter);
app.use("/api/tts", ttsRouter);

app.use(
  "/uploads",
  (req, res, next) => {
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    next();
  },
  express.static(path.join(__dirname, "uploads"), {
    dotfiles: "deny",
    index: false,
    fallthrough: false,
    maxAge: "1d",
  })
);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
