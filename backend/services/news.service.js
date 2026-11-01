
const mongoose = require("mongoose");

const News = require("../models/News");
const Category = require("../models/Category");
const Subcategory = require("../models/Subcategory");

const allowedLanguages = ["en", "hi"];
const allowedStatuses = ["draft", "published", "scheduled", "archived"];

const createError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const isValidObjectId = (value) =>
  mongoose.isValidObjectId(String(value));

const escapeRegex = (value) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const generateSlug = (value) => {
  return value
    .normalize("NFC")
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
};

const mergeLocalizedFields = (existing, incoming) => {
  const current =
    existing && typeof existing.toObject === "function"
      ? existing.toObject()
      : existing?.toJSON?.() || existing || {};

  const result = { ...current };

  for (const language of allowedLanguages) {
    if (incoming?.[language] !== undefined) {
      const previous = current[language] || {};
      const next = incoming[language];

      result[language] =
        next && typeof next === "object" && !Array.isArray(next)
          ? { ...previous, ...next }
          : next;
    }
  }

  return result;
};

const normalizeTags = (tags = []) => {
  if (!Array.isArray(tags)) {
    throw createError("Tags must be an array", 400);
  }

  if (tags.length > 20) {
    throw createError("Maximum 20 tags are allowed", 400);
  }

  const normalizedTags = tags.map((tag) => {
    if (typeof tag !== "string" || !tag.trim()) {
      throw createError("Every tag must be a non-empty string", 400);
    }

    const value = tag.trim().toLowerCase();

    if (value.length > 40) {
      throw createError("Each tag must be 40 characters or fewer", 400);
    }

    return value;
  });

  if (new Set(normalizedTags).size !== normalizedTags.length) {
    throw createError("Duplicate tags are not allowed", 400);
  }

  return normalizedTags;
};

const validateNewsReferences = async ({
  categoryId,
  subcategoryId,
}) => {
  if (!isValidObjectId(categoryId)) {
    throw createError("Invalid category ID", 400);
  }

  const category = await Category.findOne({
    _id: categoryId,
    isActive: true,
  }).select("_id");

  if (!category) {
    throw createError("Category not found or inactive", 404);
  }

  if (subcategoryId) {
    if (!isValidObjectId(subcategoryId)) {
      throw createError("Invalid subcategory ID", 400);
    }

    const subcategory = await Subcategory.findOne({
      _id: subcategoryId,
      category: categoryId,
      isActive: true,
    }).select("_id");

    if (!subcategory) {
      throw createError(
        "Subcategory not found, inactive, or does not belong to this category",
        400
      );
    }
  }
};

const validateMediaLimits = (media = []) => {
  if (!Array.isArray(media)) {
    throw createError("Article media must be an array", 400);
  }

  if (media.length > 13) {
    throw createError("Maximum 13 media items are allowed", 400);
  }

  const images = media.filter((item) => item.type === "image");
  const videos = media.filter((item) => item.type === "video");

  if (images.length > 10) {
    throw createError("Maximum 10 article images are allowed", 400);
  }

  if (videos.length > 3) {
    throw createError("Maximum 3 article videos are allowed", 400);
  }

  const orders = media.map((item) => item.order);

  if (
    orders.some(
      (order) =>
        !Number.isInteger(order) ||
        order < 0 ||
        order > 12
    )
  ) {
    throw createError("Every media item must have a valid order", 400);
  }

  if (new Set(orders).size !== orders.length) {
    throw createError("Media order values must be unique", 400);
  }
};

const checkSlugAvailability = async (
  localizedContent,
  availableLanguages,
  excludeId = null
) => {
  for (const language of availableLanguages) {
    const title = localizedContent?.[language]?.title;

    if (typeof title !== "string" || !title.trim()) {
      continue;
    }

    const slug = generateSlug(title);

    if (!slug) {
      throw createError(
        `Unable to generate a valid ${language} slug from the title`,
        400
      );
    }

    const query = {
      [`title.${language}.slug`]: slug,
    };

    if (excludeId) {
      query._id = { $ne: excludeId };
    }

    const existingNews = await News.exists(query);

    if (existingNews) {
      throw createError(
        `The generated ${language} slug "${slug}" is already in use`,
        409
      );
    }
  }
};

const handleDuplicateSlugError = (error) => {
  if (error?.code === 11000) {
    throw createError(
      "An article with this generated slug already exists. Change the article title and try again.",
      409
    );
  }

  throw error;
};

const validateScheduledState = (status, scheduledAt) => {
  if (status === "scheduled") {
    const date = new Date(scheduledAt);

    if (
      !scheduledAt ||
      Number.isNaN(date.getTime()) ||
      date <= new Date()
    ) {
      throw createError(
        "A valid future scheduled date is required",
        400
      );
    }
  }
};

const createNews = async (data, userId) => {
  await validateNewsReferences({
    categoryId: data.category,
    subcategoryId: data.subcategory,
  });

  const availableLanguages = data.availableLanguages;
  const tags = normalizeTags(data.tags || []);
  const media = data.media || [];

  validateMediaLimits(media);
  validateScheduledState(data.status, data.scheduledAt);

  await checkSlugAvailability(
    data.title,
    availableLanguages
  );

  try {
    const news = await News.create({
      title: data.title,
      availableLanguages,
      category: data.category,
      subcategory: data.subcategory || null,
      thumbnail: data.thumbnail,
      thumbnailAlt: data.thumbnailAlt || {},
      media,
      tags,
      status: data.status,
      scheduledAt:
        data.status === "scheduled" ? data.scheduledAt : null,
      seo: data.seo || {},
      isFeatured: data.isFeatured ?? false,
      isBreaking: data.isBreaking ?? false,
      isTrending: data.isTrending ?? false,
      author: userId,
      createdBy: userId,
      updatedBy: userId,
      publishedAt:
        data.status === "published" ? new Date() : null,
    });

    return news;
  } catch (error) {
    handleDuplicateSlugError(error);
  }
};

const updateNews = async (newsId, data, userId) => {
  if (!isValidObjectId(newsId)) {
    throw createError("Invalid news ID", 400);
  }

  const news = await News.findById(newsId);

  if (!news) {
    throw createError("News article not found", 404);
  }

  const categoryChanged =
    data.category !== undefined &&
    String(data.category) !== String(news.category);

  const subcategoryChanged =
    data.subcategory !== undefined &&
    String(data.subcategory || "") !==
      String(news.subcategory || "");

  if (categoryChanged || subcategoryChanged) {
    const nextCategory = data.category ?? news.category;

    const nextSubcategory =
      data.subcategory !== undefined
        ? data.subcategory
        : news.subcategory || null;

    await validateNewsReferences({
      categoryId: nextCategory,
      subcategoryId: nextSubcategory,
    });
  }

  const nextTitle =
    data.title !== undefined
      ? mergeLocalizedFields(news.title, data.title)
      : news.title.toObject();

  const nextLanguages =
    data.availableLanguages !== undefined
      ? data.availableLanguages
      : news.availableLanguages;

  await checkSlugAvailability(
    nextTitle,
    nextLanguages,
    news._id
  );

  const nextTags =
    data.tags !== undefined
      ? normalizeTags(data.tags)
      : news.tags.map((tag) => String(tag));

  if (data.media !== undefined) {
    validateMediaLimits(data.media);
  }

  const nextStatus = data.status ?? news.status;

  const nextScheduledAt =
    data.scheduledAt !== undefined
      ? data.scheduledAt
      : news.scheduledAt;

  validateScheduledState(nextStatus, nextScheduledAt);

  const previousStatus = news.status;

  const editableFields = [
    "availableLanguages",
    "category",
    "subcategory",
    "thumbnail",
    "status",
    "isFeatured",
    "isBreaking",
    "isTrending",
  ];

  for (const field of editableFields) {
    if (Object.prototype.hasOwnProperty.call(data, field)) {
      news.set(field, data[field]);
    }
  }

  if (data.title !== undefined) {
    news.title = nextTitle;
  }

  if (data.tags !== undefined) {
    news.tags = nextTags;
  }

  if (data.thumbnailAlt !== undefined) {
    news.thumbnailAlt = mergeLocalizedFields(
      news.thumbnailAlt,
      data.thumbnailAlt
    );
  }

  if (data.seo !== undefined) {
    news.seo = mergeLocalizedFields(
      news.seo,
      data.seo
    );
  }

  if (data.media !== undefined) {
    news.media = data.media;
  }

  if (news.status === "published") {
    if (previousStatus !== "published") {
      news.publishedAt = new Date();
    }

    news.scheduledAt = null;
  } else {
    news.publishedAt = null;

    if (news.status === "scheduled") {
      news.scheduledAt = nextScheduledAt;
    } else {
      news.scheduledAt = null;
    }
  }

  news.updatedBy = userId;

  try {
    await news.save();
    return news;
  } catch (error) {
    handleDuplicateSlugError(error);
  }
};

const archiveNews = async (newsId, userId) => {
  if (!isValidObjectId(newsId)) {
    throw createError("Invalid news ID", 400);
  }

  const news = await News.findById(newsId);

  if (!news) {
    throw createError("News article not found", 404);
  }

  news.status = "archived";
  news.publishedAt = null;
  news.scheduledAt = null;
  news.updatedBy = userId;

  await news.save();

  return news;
};

const getPublicNewsBySlug = async (language, slug) => {
  if (!allowedLanguages.includes(language)) {
    throw createError("Unsupported language", 400);
  }

  if (
    typeof slug !== "string" ||
    !slug.trim() ||
    slug.length > 220
  ) {
    throw createError("Invalid news slug", 400);
  }

  const news = await News.findOne({
    [`title.${language}.slug`]: slug,
    availableLanguages: language,
    status: "published",
    publishedAt: { $lte: new Date() },
  })
    .select("-createdBy -updatedBy")
    .populate({
      path: "category",
      select: "name slug",
      match: { isActive: true },
    })
    .populate({
      path: "subcategory",
      select: "name slug",
      match: { isActive: true },
    })
    .populate("author", "name avatar")
    .lean();

  if (!news || !news.category) {
    throw createError("News article not found", 404);
  }

  return news;
};

const getPublicNews = async ({
  language = "en",
  page = 1,
  limit = 10,
  category,
  subcategory,
  search,
  sort = "latest",
  featured,
  trending,
} = {}) => {
  if (!allowedLanguages.includes(language)) {
    throw createError("Unsupported language", 400);
  }

  const safePage = Math.max(1, Number(page) || 1);
  const safeLimit = Math.min(50, Math.max(1, Number(limit) || 10));

  const activeCategories = await Category.find({
    isActive: true,
  }).distinct("_id");

  const filter = {
    availableLanguages: language,
    status: "published",
    publishedAt: { $lte: new Date() },
    category: { $in: activeCategories },
  };

  if (category) {
    if (!isValidObjectId(category)) {
      throw createError("Invalid category ID", 400);
    }

    filter.category = {
      $in: activeCategories.filter(
        (id) => String(id) === String(category)
      ),
    };
  }

  if (subcategory) {
    if (!isValidObjectId(subcategory)) {
      throw createError("Invalid subcategory ID", 400);
    }

    const activeSubcategory = await Subcategory.findOne({
      _id: subcategory,
      isActive: true,
    }).select("_id category");

    if (!activeSubcategory) {
      throw createError("Subcategory not found or inactive", 404);
    }

    filter.subcategory = activeSubcategory._id;
    filter.category = activeSubcategory.category;
  }

  if (featured === true || featured === "true") {
    filter.isFeatured = true;
  }

  if (trending === true || trending === "true") {
    filter.isTrending = true;
  }

  if (search && typeof search === "string" && search.trim()) {
    const safeSearch = escapeRegex(search.trim().slice(0, 100));

    filter.$or = [
      {
        [`title.${language}.title`]: {
          $regex: safeSearch,
          $options: "i",
        },
      },
      {
        [`title.${language}.excerpt`]: {
          $regex: safeSearch,
          $options: "i",
        },
      },
    ];
  }

  const sortOptions = {
    latest: { publishedAt: -1, _id: -1 },
    popular: { views: -1, publishedAt: -1, _id: -1 },
  };

  const sortBy = sortOptions[sort] || sortOptions.latest;
  const skip = (safePage - 1) * safeLimit;

  const [news, total] = await Promise.all([
    News.find(filter)
      .select("-createdBy -updatedBy")
      .populate({
        path: "category",
        select: "name slug",
        match: { isActive: true },
      })
      .populate({
        path: "subcategory",
        select: "name slug",
        match: { isActive: true },
      })
      .populate("author", "name avatar")
      .sort(sortBy)
      .skip(skip)
      .limit(safeLimit)
      .lean(),

    News.countDocuments(filter),
  ]);

  return {
    news,
    pagination: {
      total,
      page: safePage,
      limit: safeLimit,
      totalPages: Math.ceil(total / safeLimit),
      hasNextPage: safePage * safeLimit < total,
      hasPreviousPage: safePage > 1,
    },
  };
};

const getHomepageData = async (language = "en") => {
  if (!allowedLanguages.includes(language)) {
    throw createError("Unsupported language", 400);
  }

  const now = new Date();

  // Shared conditions: only publicly visible articles.
  const baseFilter = {
    availableLanguages: language,
    status: "published",
    publishedAt: { $lte: now },
  };

  const populateNews = (query) =>
    query
      .select("-createdBy -updatedBy")
      .populate({
        path: "category",
        select: "name slug",
        match: { isActive: true },
      })
      .populate({
        path: "subcategory",
        select: "name slug",
        match: { isActive: true },
      })
      .populate("author", "name avatar")
      .lean();

  const [
    breakingNews,
    featuredNews,
    latestNews,
    trendingNews,
    categorySections,
  ] = await Promise.all([
    // Breaking news
    populateNews(
      News.find({
        ...baseFilter,
        isBreaking: true,
      })
        .sort({ publishedAt: -1, _id: -1 })
        .limit(10)
    ),

    // Featured news
    populateNews(
      News.find({
        ...baseFilter,
        isFeatured: true,
      })
        .sort({ publishedAt: -1, _id: -1 })
        .limit(5)
    ),

    // Latest news
    populateNews(
      News.find(baseFilter)
        .sort({ publishedAt: -1, _id: -1 })
        .limit(20)
    ),

    // Trending news
    populateNews(
      News.find({
        ...baseFilter,
        isTrending: true,
      })
        .sort({ views: -1, publishedAt: -1, _id: -1 })
        .limit(5)
    ),

    // Active categories with their latest four articles.
    Category.aggregate([
      {
        $match: { isActive: true },
      },
      {
        $sort: { displayOrder: 1, _id: 1 },
      },
      {
        $lookup: {
          from: News.collection.name,
          let: { categoryId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$category", "$$categoryId"] },
                    { $in: [language, "$availableLanguages"] },
                    { $eq: ["$status", "published"] },
                    { $lte: ["$publishedAt", now] },
                  ],
                },
              },
            },
            {
              $sort: { publishedAt: -1, _id: -1 },
            },
            {
              $limit: 4,
            },
            {
              $project: {
                createdBy: 0,
                updatedBy: 0,
              },
            },
          ],
          as: "news",
        },
      },
      {
        $project: {
          name: 1,
          slug: 1,
          image: 1,
          displayOrder: 1,
          news: 1,
        },
      },
    ]),
  ]);

  // Populate references inside the aggregation results.
  const categoryArticles = categorySections.flatMap(
    (section) => section.news
  );

  await News.populate(categoryArticles, [
    { path: "author", select: "name avatar" },
    { path: "subcategory", select: "name slug" },
  ]);

  // Attach the already-fetched category object to each article.
  const formattedCategorySections = categorySections.map(
    (section) => ({
      category: {
        _id: section._id,
        name: section.name,
        slug: section.slug,
        image: section.image,
      },
      news: section.news.map((article) => ({
        ...article,
        category: {
          _id: section._id,
          name: section.name,
          slug: section.slug,
        },
      })),
    })
  );

  return {
    breakingNews,
    featuredNews,
    latestNews,
    trendingNews,
    categorySections: formattedCategorySections,
  };
};


const getAdminNews = async ({
  page = 1,
  limit = 10,
  status,
  category,
  search,
} = {}) => {
  const safePage = Math.max(1, Number(page) || 1);
  const safeLimit = Math.min(100, Math.max(1, Number(limit) || 10));

  const filter = {};

  if (status) {
    if (!allowedStatuses.includes(status)) {
      throw createError("Invalid news status filter", 400);
    }

    filter.status = status;
  }

  if (category) {
    if (!isValidObjectId(category)) {
      throw createError("Invalid category ID", 400);
    }

    filter.category = category;
  }

  if (search && typeof search === "string" && search.trim()) {
    const safeSearch = escapeRegex(search.trim().slice(0, 100));

    filter.$or = [
      {
        "title.en.title": {
          $regex: safeSearch,
          $options: "i",
        },
      },
      {
        "title.hi.title": {
          $regex: safeSearch,
          $options: "i",
        },
      },
    ];
  }

  const skip = (safePage - 1) * safeLimit;

  const [news, total] = await Promise.all([
    News.find(filter)
      .populate("category", "name slug")
      .populate("subcategory", "name slug")
      .populate("author", "name")
      .sort({ updatedAt: -1, _id: -1 })
      .skip(skip)
      .limit(safeLimit)
      .lean(),

    News.countDocuments(filter),
  ]);

  return {
    news,
    pagination: {
      total,
      page: safePage,
      limit: safeLimit,
      totalPages: Math.ceil(total / safeLimit),
    },
  };
};

const getAdminNewsById = async (newsId) => {
  if (!isValidObjectId(newsId)) {
    throw createError("Invalid news ID", 400);
  }

  const news = await News.findById(newsId)
    .populate("category", "name slug")
    .populate("subcategory", "name slug category")
    .populate("author", "name email avatar")
    .lean();

  if (!news) {
    throw createError("News article not found", 404);
  }

  return news;
};

const incrementNewsViews = async (newsId, language) => {
  if (!isValidObjectId(newsId)) {
    throw createError("Invalid news ID", 400);
  }

  if (!allowedLanguages.includes(language)) {
    throw createError("Unsupported language", 400);
  }

  const news = await News.findOneAndUpdate(
    {
      _id: newsId,
      availableLanguages: language,
      status: "published",
      publishedAt: { $lte: new Date() },
    },
    {
      $inc: { views: 1 },
    },
    {
      new: true,
      projection: { views: 1 },
    }
  ).lean();

  if (!news) {
    throw createError("News article not found", 404);
  }

  return news.views;
};

module.exports = {
  createNews,
  updateNews,
  archiveNews,
  getPublicNewsBySlug,
  getPublicNews,
  getAdminNews,
  getAdminNewsById,
  incrementNewsViews,
   getHomepageData,
};
