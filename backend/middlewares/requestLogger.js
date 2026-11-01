
const logger = require("../config/logger");

const requestLogger = (req, res, next) => {
  const startTime = process.hrtime.bigint();

  res.on("finish", () => {
    const duration = Number(
      process.hrtime.bigint() - startTime
    ) / 1_000_000;

    const logData = {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      durationMs: Number(duration.toFixed(2)),
    };

    if (res.statusCode >= 500) {
      logger.error("HTTP request failed", logData);
    } else if (res.statusCode >= 400) {
      logger.warn("HTTP request returned an error", logData);
    } else {
      logger.info("HTTP request completed", logData);
    }
  });

  next();
};

module.exports = requestLogger;
