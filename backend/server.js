
const app = require("./app");
const connectDB = require("./config/database");
const env = require("./config/env");
const mongoose = require("mongoose");

const startServer = async () => {
  let server;
  let isShuttingDown = false;

  try {
    await connectDB();

    server = app.listen(env.PORT);

    server.on("listening", () => {
      console.log(`Server running on port ${env.PORT}`);
    });

    server.on("error", (error) => {
      console.error("HTTP server error:", error.message);
      process.exit(1);
    });

    const shutdown = async (signal) => {
      if (isShuttingDown) return;

      isShuttingDown = true;
      console.log(`${signal} received. Starting graceful shutdown...`);

      const forceShutdown = setTimeout(() => {
        console.error("Graceful shutdown timed out");
        process.exit(1);
      }, 10000);

      forceShutdown.unref();

      try {
        await new Promise((resolve, reject) => {
          server.close((error) => {
            if (error) return reject(error);
            resolve();
          });
        });

        await mongoose.connection.close();

        console.log("Server and database closed successfully");
        process.exitCode = 0;
      } catch (error) {
        console.error("Shutdown failed:", error.message);
        process.exitCode = 1;
      } finally {
        clearTimeout(forceShutdown);
      }
    };

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));

  } catch (error) {
    console.error("Server startup failed:", error.message);
    process.exit(1);
  }
};

startServer();
