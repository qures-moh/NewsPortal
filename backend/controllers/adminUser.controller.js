const adminUserService = require("../services/adminUser.service");

const getUsers = async (req, res, next) => {
  try {
    const result = await adminUserService.getUsers(req.query);

    return res.status(200).json({
      success: true,
      message: "Users fetched successfully",
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

const getUserById = async (req, res, next) => {
  try {
    const user = await adminUserService.getUserById(req.params.id);

    return res.status(200).json({
      success: true,
      message: "User details fetched successfully",
      user,
    });
  } catch (error) {
    next(error);
  }
};

const getUserStats = async (req, res, next) => {
  try {
    const stats = await adminUserService.getUserStats();

    return res.status(200).json({
      success: true,
      message: "User statistics fetched successfully",
      stats,
    });
  } catch (error) {
    next(error);
  }
};

const updateUserStatus = async (req, res, next) => {
  try {
    const user = await adminUserService.updateUserStatus(
      req.params.id,
      req.body.isActive,
      req.user.id
    );

    return res.status(200).json({
      success: true,
      message: "User status updated successfully",
      user,
    });
  } catch (error) {
    next(error);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    const result = await adminUserService.deleteUser(
      req.params.id,
      req.user.id
    );

    return res.status(200).json({
      success: true,
      message: "User deleted successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUsers,
  getUserById,
  getUserStats,
  updateUserStatus,
  deleteUser,
};