
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
    isTrending: false,
    trendingOrder: 0,
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
    const escapedSearch = search
      .trim()
      .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    filter.$or = [
      { "name.en": { $regex: escapedSearch, $options: "i" } },
      { "name.hi": { $regex: escapedSearch, $options: "i" } },
    ];
  }

  const skip = (page - 1) * limit;

  const [tags, total] = await Promise.all([
    Tag.find(filter)
      .populate("createdBy", "name email")
      .populate("updatedBy", "name email")
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
  return Tag.find({
    isActive: true,
    isTrending: true,
  })
    .select("name slug isTrending trendingOrder")
    .sort({ trendingOrder: 1, _id: 1 })
    .limit(5)
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
  if (typeof isActive !== "boolean") {
    throw createError("isActive must be a boolean");
  }

  const tag = await Tag.findById(tagId);

  if (!tag) {
    throw createError("Tag not found", 404);
  }

  if (!isActive && tag.isTrending) {
    await Tag.updateMany(
      {
        isActive: true,
        isTrending: true,
        trendingOrder: { $gt: tag.trendingOrder },
        _id: { $ne: tagId },
      },
      {
        $inc: { trendingOrder: -1 },
      }
    );
  }

  tag.isActive = isActive;
  tag.updatedBy = userId;

  if (!isActive) {
    tag.isTrending = false;
    tag.trendingOrder = 0;
  }

  await tag.save();

  return tag;
};

const updateTagTrending = async (
  tagId,
  isTrending,
  trendingOrder,
  userId
) => {
  if (typeof isTrending !== "boolean") {
    throw createError("isTrending must be a boolean");
  }

  const tag = await Tag.findById(tagId);

  if (!tag) {
    throw createError("Tag not found", 404);
  }

  if (isTrending && !tag.isActive) {
    throw createError("Inactive tags cannot be selected as trending");
  }

  if (!isTrending) {
    if (tag.isTrending) {
      await Tag.updateMany(
        {
          isActive: true,
          isTrending: true,
          trendingOrder: { $gt: tag.trendingOrder },
          _id: { $ne: tagId },
        },
        {
          $inc: { trendingOrder: -1 },
        }
      );
    }

    tag.isTrending = false;
    tag.trendingOrder = 0;
    tag.updatedBy = userId;

    await tag.save();

    return tag;
  }

  if (
    !Number.isInteger(trendingOrder) ||
    trendingOrder < 1 ||
    trendingOrder > 5
  ) {
    throw createError("Trending order must be an integer between 1 and 5");
  }

  const trendingCount = await Tag.countDocuments({
    isActive: true,
    isTrending: true,
    _id: { $ne: tagId },
  });

  if (!tag.isTrending && trendingCount >= 5) {
    throw createError(
      "You can select a maximum of 5 trending tags",
      409
    );
  }

  if (trendingOrder > trendingCount + 1) {
    throw createError(
      `Trending order must be between 1 and ${trendingCount + 1}`
    );
  }

  const previousOrder = tag.trendingOrder;

  if (tag.isTrending && previousOrder !== trendingOrder) {
    if (trendingOrder < previousOrder) {
      await Tag.updateMany(
        {
          isActive: true,
          isTrending: true,
          trendingOrder: {
            $gte: trendingOrder,
            $lt: previousOrder,
          },
          _id: { $ne: tagId },
        },
        {
          $inc: { trendingOrder: 1 },
        }
      );
    } else {
      await Tag.updateMany(
        {
          isActive: true,
          isTrending: true,
          trendingOrder: {
            $gt: previousOrder,
            $lte: trendingOrder,
          },
          _id: { $ne: tagId },
        },
        {
          $inc: { trendingOrder: -1 },
        }
      );
    }
  } else if (!tag.isTrending) {
    await Tag.updateMany(
      {
        isActive: true,
        isTrending: true,
        trendingOrder: { $gte: trendingOrder },
      },
      {
        $inc: { trendingOrder: 1 },
      }
    );
  }

  tag.isTrending = true;
  tag.trendingOrder = trendingOrder;
  tag.updatedBy = userId;

  await tag.save();

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

  if (tag.isTrending) {
    await Tag.updateMany(
      {
        isActive: true,
        isTrending: true,
        trendingOrder: { $gt: tag.trendingOrder },
        _id: { $ne: tagId },
      },
      {
        $inc: { trendingOrder: -1 },
      }
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
  updateTagTrending,
  deleteTag,
};
