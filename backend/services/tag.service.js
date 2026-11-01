
const Tag = require("../models/Tag");
const News = require("../models/News");

const createError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const checkSlugAvailability = async (slug, excludeId = null) => {
  for (const language of ["en", "hi"]) {
    const query = {
      [`slug.${language}`]: slug[language],
    };

    if (excludeId) {
      query._id = { $ne: excludeId };
    }

    const existingTag = await Tag.findOne(query).select("_id");

    if (existingTag) {
      throw createError(
        `${language} tag slug already exists: ${slug[language]}`,
        409
      );
    }
  }
};

const createTag = async (data, userId) => {
  await checkSlugAvailability(data.slug);

  return Tag.create({
    ...data,
    createdBy: userId,
  });
};

const updateTag = async (tagId, data, userId) => {
  const tag = await Tag.findById(tagId);

  if (!tag) {
    throw createError("Tag not found", 404);
  }

  const nextSlug = {
    en: data.slug?.en ?? tag.slug.en,
    hi: data.slug?.hi ?? tag.slug.hi,
  };

  if (data.slug) {
    await checkSlugAvailability(nextSlug, tagId);
  }

  if (data.name) {
    tag.name = {
      en: data.name.en ?? tag.name.en,
      hi: data.name.hi ?? tag.name.hi,
    };
  }

  if (data.slug) {
    tag.slug = nextSlug;
  }

  if (data.description) {
    tag.description = {
      en: data.description.en ?? tag.description.en,
      hi: data.description.hi ?? tag.description.hi,
    };
  }

  tag.updatedBy = userId;

  await tag.save();

  return tag;
};

const getAdminTags = async ({
  page = 1,
  limit = 10,
  search = "",
  status = "all",
} = {}) => {
  const filter = {};

  if (status === "active") filter.isActive = true;
  if (status === "inactive") filter.isActive = false;

  if (search.trim()) {
    const escapedSearch = search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    filter.$or = [
      { "name.en": { $regex: escapedSearch, $options: "i" } },
      { "name.hi": { $regex: escapedSearch, $options: "i" } },
    ];
  }

  const skip = (page - 1) * limit;

  const [tags, total] = await Promise.all([
    Tag.find(filter)
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Tag.countDocuments(filter),
  ]);

  return {
    tags,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const getPublicTags = async () => {
  return Tag.find({ isActive: true })
    .select("name slug description")
    .sort({ createdAt: -1 })
    .lean();
};

const getTagById = async (tagId) => {
  const tag = await Tag.findById(tagId);

  if (!tag) {
    throw createError("Tag not found", 404);
  }

  return tag;
};

const updateTagStatus = async (tagId, isActive, userId) => {
  const tag = await Tag.findByIdAndUpdate(
    tagId,
    {
      $set: {
        isActive,
        updatedBy: userId,
      },
    },
    {
      new: true,
      runValidators: true,
    }
  );

  if (!tag) {
    throw createError("Tag not found", 404);
  }

  return tag;
};

const deleteTag = async (tagId) => {
  const tag = await Tag.findById(tagId);

  if (!tag) {
    throw createError("Tag not found", 404);
  }

  const newsExists = await News.exists({
    tags: tagId,
  });

  if (newsExists) {
    throw createError(
      "Cannot delete this tag because news articles are using it. Deactivate it instead.",
      409
    );
  }

  await tag.deleteOne();

  return {
    message: "Tag deleted successfully",
  };
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
