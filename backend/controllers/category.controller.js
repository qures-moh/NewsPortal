
const categoryService = require("../services/category.service");

const createCategory = async (req, res) => {
  const category = await categoryService.createCategory(
    req.validatedData,
    req.user.id
  );

  res.status(201).json({
    success: true,
    message: "Category created successfully",
    category,
  });
};

const updateCategory = async (req, res) => {
  const category = await categoryService.updateCategory(
    req.params.id,
    req.validatedData,
    req.user.id
  );

  res.status(200).json({
    success: true,
    message: "Category updated successfully",
    category,
  });
};

const getAdminCategories = async (req, res) => {
  const page = Number(req.query.page || 1);
  const limit = Number(req.query.limit || 10);

  if (
    !Number.isInteger(page) ||
    page < 1 ||
    !Number.isInteger(limit) ||
    limit < 1 ||
    limit > 100
  ) {
    return res.status(400).json({
      success: false,
      message: "Invalid pagination parameters",
    });
  }

  const result = await categoryService.getAdminCategories({
    page,
    limit,
    search: String(req.query.search || ""),
    status: String(req.query.status || "all"),
  });

  res.status(200).json({
    success: true,
    ...result,
  });
};

const getPublicCategories = async (req, res) => {
  const categories = await categoryService.getPublicCategories();

  res.status(200).json({
    success: true,
    categories,
  });
};

const getCategoryById = async (req, res) => {
  const category = await categoryService.getCategoryById(req.params.id);

  res.status(200).json({
    success: true,
    category,
  });
};

const updateCategoryStatus = async (req, res) => {
  const { isActive } = req.body;

  if (typeof isActive !== "boolean") {
    return res.status(400).json({
      success: false,
      message: "isActive must be a boolean",
    });
  }

  const category = await categoryService.updateCategoryStatus(
    req.params.id,
    isActive,
    req.user.id
  );

  res.status(200).json({
    success: true,
    message: "Category status updated successfully",
    category,
  });
};

const deleteCategory = async (req, res) => {
  const result = await categoryService.deleteCategory(req.params.id);

  res.status(200).json({
    success: true,
    ...result,
  });
};

module.exports = {
  createCategory,
  updateCategory,
  getAdminCategories,
  getPublicCategories,
  getCategoryById,
  updateCategoryStatus,
  deleteCategory,
};
