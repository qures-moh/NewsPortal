
const subcategoryService = require("../services/subcategory.service");

const createSubcategory = async (req, res) => {
  const subcategory = await subcategoryService.createSubcategory(
    req.validatedData,
    req.user.id
  );

  res.status(201).json({
    success: true,
    message: "Subcategory created successfully",
    subcategory,
  });
};

const updateSubcategory = async (req, res) => {
  const subcategory = await subcategoryService.updateSubcategory(
    req.params.id,
    req.validatedData,
    req.user.id
  );

  res.status(200).json({
    success: true,
    message: "Subcategory updated successfully",
    subcategory,
  });
};

const getAdminSubcategories = async (req, res) => {
  const page = Number(req.query.page || 1);
  const limit = Number(req.query.limit || 10);
  const search = String(req.query.search || "");
  const status = String(req.query.status || "all");
  const category = req.query.category
    ? String(req.query.category)
    : undefined;

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

  if (!["all", "active", "inactive"].includes(status)) {
    return res.status(400).json({
      success: false,
      message: "Invalid status filter",
    });
  }

  if (category && !/^[a-fA-F0-9]{24}$/.test(category)) {
    return res.status(400).json({
      success: false,
      message: "Invalid category ID",
    });
  }

  const result = await subcategoryService.getAdminSubcategories({
    page,
    limit,
    search,
    status,
    category,
  });

  res.status(200).json({
    success: true,
    ...result,
  });
};

const getPublicSubcategories = async (req, res) => {
  const { categoryId } = req.params;

  if (!/^[a-fA-F0-9]{24}$/.test(categoryId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid category ID",
    });
  }

  const subcategories =
    await subcategoryService.getPublicSubcategories(categoryId);

  res.status(200).json({
    success: true,
    subcategories,
  });
};

const getSubcategoryById = async (req, res) => {
  const subcategory = await subcategoryService.getSubcategoryById(
    req.params.id
  );

  res.status(200).json({
    success: true,
    subcategory,
  });
};

const updateSubcategoryStatus = async (req, res) => {
  const { isActive } = req.body;

  if (typeof isActive !== "boolean") {
    return res.status(400).json({
      success: false,
      message: "isActive must be a boolean",
    });
  }

  const subcategory =
    await subcategoryService.updateSubcategoryStatus(
      req.params.id,
      isActive,
      req.user.id
    );

  res.status(200).json({
    success: true,
    message: "Subcategory status updated successfully",
    subcategory,
  });
};

const deleteSubcategory = async (req, res) => {
  const result = await subcategoryService.deleteSubcategory(
    req.params.id
  );

  res.status(200).json({
    success: true,
    ...result,
  });
};

module.exports = {
  createSubcategory,
  updateSubcategory,
  getAdminSubcategories,
  getPublicSubcategories,
  getSubcategoryById,
  updateSubcategoryStatus,
  deleteSubcategory,
};
