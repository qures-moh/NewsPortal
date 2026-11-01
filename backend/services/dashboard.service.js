
const News = require("../models/News");
const Category = require("../models/Category");
const Subcategory = require("../models/Subcategory");
const Tag = require("../models/Tag");
const User = require("../models/User");

const getDashboardStats = async () => {
  const [
    totalNews,
    publishedNews,
    draftNews,
    scheduledNews,
    archivedNews,
    viewsResult,
    totalCategories,
    totalSubcategories,
    totalTags,
    totalUsers,
    totalAdmins,
    recentNews,
  ] = await Promise.all([
    News.countDocuments(),
    News.countDocuments({ status: "published" }),
    News.countDocuments({ status: "draft" }),
    News.countDocuments({ status: "scheduled" }),
    News.countDocuments({ status: "archived" }),

    News.aggregate([
      {
        $group: {
          _id: null,
          totalViews: { $sum: { $ifNull: ["$views", 0] } },
        },
      },
    ]),

    Category.countDocuments({ isActive: true }),
    Subcategory.countDocuments({ isActive: true }),
    Tag.countDocuments({ isActive: true }),
    User.countDocuments({ role: "user" }),
    User.countDocuments({ role: "admin" }),

    News.find()
      .select("title status views createdAt publishedAt")
      .populate("category", "name")
      .populate("author", "name")
      .sort({ createdAt: -1 })
      .limit(6)
      .lean(),
  ]);

  return {
    stats: {
      totalNews,
      publishedNews,
      draftNews,
      scheduledNews,
      archivedNews,
      totalViews: viewsResult[0]?.totalViews || 0,
      totalCategories,
      totalSubcategories,
      totalTags,
      totalUsers,
      totalAdmins,
    },
    recentNews,
  };
};

module.exports = { getDashboardStats };
