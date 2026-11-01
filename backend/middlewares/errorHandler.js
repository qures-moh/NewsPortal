
const logger = require("../config/logger");

const errorHandler = (err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  let statusCode = Number(err.statusCode || err.status) || 500;
  let message = err.message || "Internal server error";

  if (err.name === "ValidationError") {
    statusCode = 400;
    message = "Validation failed";
  } else if (err.code === 11000) {
    statusCode = 409;

    const field = Object.keys(err.keyValue || {})[0];

    message = field
      ? `${field} already exists`
      : "Duplicate value already exists";
  } else if (err.name === "CastError") {
    statusCode = 400;
    message = "Invalid resource identifier";
  } else if (
    err.name === "JsonWebTokenError" ||
    err.name === "TokenExpiredError"
  ) {
    statusCode = 401;
    message = "Invalid or expired authentication token";
  } else if (err.name === "MulterError") {
    statusCode = err.code === "LIMIT_FILE_SIZE" ? 413 : 400;

    message =
      err.code === "LIMIT_FILE_SIZE"
        ? "Uploaded file is too large"
        : "File upload failed";
  } else if (err.type === "entity.parse.failed") {
    statusCode = 400;
    message = "Invalid JSON request body";
  } else if (err.type === "entity.too.large") {
    statusCode = 413;
    message = "Request body is too large";
  } else if (err.name === "URIError") {
    statusCode = 400;
    message = "Invalid request URL";
  }

  if (
    !Number.isInteger(statusCode) ||
    statusCode < 400 ||
    statusCode > 599
  ) {
    statusCode = 500;
  }

  if (statusCode >= 500) {
    message = "Internal server error";
  }

  const logData = {
    errorName: err.name,
    errorMessage: err.message,
    method: req.method,
    path: req.path,
    statusCode,
    stack: err.stack,
  };

  if (statusCode >= 500) {
    logger.error("Application error", logData);
  } else {
    logger.warn("Request error", logData);
  }

  const response = {
    success: false,
    message:
      process.env.NODE_ENV === "production"
        ? statusCode >= 500
          ? "Internal server error"
          : message
        : err.message || message,
  };

  if (process.env.NODE_ENV !== "production" && statusCode >= 500) {
    response.stack = err.stack;
  }

  return res.status(statusCode).json(response);
};

module.exports = errorHandler;
