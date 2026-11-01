
const dashboardService = require("../services/dashboard.service");

const getDashboard = async (req, res, next) => {
  try {
    const dashboard = await dashboardService.getDashboardStats();

    res.status(200).json({
      success: true,
      message: "Dashboard data fetched successfully",
      data: dashboard,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getDashboard };
