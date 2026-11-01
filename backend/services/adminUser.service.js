const mongoose = require("mongoose");
const User = require("../models/User");

const escapeRegex = (value) => {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

// Get all users with search, filters and pagination
const getUsers = async (query) => {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const limit = Math.min(
    100,
    Math.max(1, Number.parseInt(query.limit, 10) || 10)
  );

  const filter = {};

  if (query.search?.trim()) {
    const search = escapeRegex(query.search.trim());

    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
    ];
  }

  if (query.status === "active") {
    filter.isActive = true;
  } else if (query.status === "inactive") {
    filter.isActive = false;
  }

  if (query.role === "user" || query.role === "admin") {
    filter.role = query.role;
  }

  const skip = (page - 1) * limit;

  const [users, total] = await Promise.all([
    User.find(filter)
      .select("name email role avatar isActive isEmailVerified lastLogin createdAt")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),

    User.countDocuments(filter),
  ]);

  return {
    users,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

// Get one user's details
const getUserById = async (id) => {
  if (!mongoose.isValidObjectId(id)) {
    const error = new Error("Invalid user ID");
    error.statusCode = 400;
    throw error;
  }

  const user = await User.findById(id)
    .select("name email role avatar isActive isEmailVerified lastLogin createdAt updatedAt")
    .lean();

  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  return user;
};

// Get user statistics
const getUserStats = async () => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [totalUsers, activeUsers, inactiveUsers, newUsers] =
    await Promise.all([
      User.countDocuments({ role: "user" }),
      User.countDocuments({ role: "user", isActive: true }),
      User.countDocuments({ role: "user", isActive: false }),
      User.countDocuments({
        role: "user",
        createdAt: { $gte: thirtyDaysAgo },
      }),
    ]);

  return {
    totalUsers,
    activeUsers,
    inactiveUsers,
    newUsers,
  };
};

// Prevent removal of the last active administrator
const ensureAnotherActiveAdminExists = async (user) => {
  if (user.role !== "admin" || !user.isActive) return;

  const activeAdmins = await User.countDocuments({
    role: "admin",
    isActive: true,
    _id: { $ne: user._id },
  });

  if (activeAdmins === 0) {
    const error = new Error(
      "You cannot remove or deactivate the last active administrator"
    );
    error.statusCode = 400;
    throw error;
  }
};

// Activate or deactivate a user
const updateUserStatus = async (id, isActive, currentAdminId) => {
  if (!mongoose.isValidObjectId(id)) {
    const error = new Error("Invalid user ID");
    error.statusCode = 400;
    throw error;
  }

  if (id === currentAdminId) {
    const error = new Error("You cannot change your own account status");
    error.statusCode = 400;
    throw error;
  }

  const user = await User.findById(id);

  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  if (typeof isActive !== "boolean") {
    const error = new Error("isActive must be true or false");
    error.statusCode = 400;
    throw error;
  }

  if (!isActive) {
    await ensureAnotherActiveAdminExists(user);
  }

  user.isActive = isActive;
  await user.save();

  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
  };
};

// Delete a user
const deleteUser = async (id, currentAdminId) => {
  if (!mongoose.isValidObjectId(id)) {
    const error = new Error("Invalid user ID");
    error.statusCode = 400;
    throw error;
  }

  if (id === currentAdminId) {
    const error = new Error("You cannot delete your own account");
    error.statusCode = 400;
    throw error;
  }

  const user = await User.findById(id);

  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  await ensureAnotherActiveAdminExists(user);

  await User.findByIdAndDelete(id);

  return { id: user._id };
};

module.exports = {
  getUsers,
  getUserById,
  getUserStats,
  updateUserStatus,
  deleteUser,
};