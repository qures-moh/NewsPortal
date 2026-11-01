
const tagService = require("../services/tag.service");

const createTag = async (req, res) => {
  const tag = await tagService.createTag(
    req.validatedData,
    req.user.id
  );

  res.status(201).json({
    success: true,
    message: "Tag created successfully",
    tag,
  });
};

const updateTag = async (req, res) => {
  const tag = await tagService.updateTag(
    req.params.id,
    req.validatedData,
    req.user.id
  );

  res.status(200).json({
    success: true,
    message: "Tag updated successfully",
    tag,
  });
};

const getAdminTags = async (req, res) => {
  const page = Number(req.query.page || 1);
  const limit = Number(req.query.limit || 10);
  const search = String(req.query.search || "");
  const status = String(req.query.status || "all");

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

  const result = await tagService.getAdminTags({
    page,
    limit,
    search,
    status,
  });

  res.status(200).json({
    success: true,
    ...result,
  });
};

const getPublicTags = async (req, res) => {
  const tags = await tagService.getPublicTags();

  res.status(200).json({
    success: true,
    tags,
  });
};

const getTagById = async (req, res) => {
  const tag = await tagService.getTagById(req.params.id);

  res.status(200).json({
    success: true,
    tag,
  });
};

const updateTagStatus = async (req, res) => {
  const { isActive } = req.body;

  if (typeof isActive !== "boolean") {
    return res.status(400).json({
      success: false,
      message: "isActive must be a boolean",
    });
  }

  const tag = await tagService.updateTagStatus(
    req.params.id,
    isActive,
    req.user.id
  );

  res.status(200).json({
    success: true,
    message: "Tag status updated successfully",
    tag,
  });
};

const deleteTag = async (req, res) => {
  const result = await tagService.deleteTag(req.params.id);

  res.status(200).json({
    success: true,
    ...result,
  });
};

module.exports = {
  createTag,
  updateTag,
  getAdminTags,
  getPublicTags,
  getTagById,
  updateTagStatus,
  deleteTag,
};
