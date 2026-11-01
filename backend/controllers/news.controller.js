
const newsService = require("../services/news.service");

const createNews = async (req, res) => {
  const news = await newsService.createNews(
    req.validatedData,
    req.user.id
  );

  res.status(201).json({
    success: true,
    message: "News article created successfully",
    data: news,
  });
};

const updateNews = async (req, res) => {
  const news = await newsService.updateNews(
    req.params.id,
    req.validatedData,
    req.user.id
  );

  res.status(200).json({
    success: true,
    message: "News article updated successfully",
    data: news,
  });
};

const archiveNews = async (req, res) => {
  const news = await newsService.archiveNews(
    req.params.id,
    req.user.id
  );

  res.status(200).json({
    success: true,
    message: "News article archived successfully",
    data: news,
  });
};

const getAdminNewsById = async (req, res) => {
  const news = await newsService.getAdminNewsById(req.params.id);

  res.status(200).json({
    success: true,
    message: "News article fetched successfully",
    data: news,
  });
};

const getPublicNewsBySlug = async (req, res) => {
  const { language, slug } = req.params;

  const news = await newsService.getPublicNewsBySlug(
    language,
    slug
  );

  res.status(200).json({
    success: true,
    message: "News article fetched successfully",
    data: news,
  });
};

const getPublicNews = async (req, res) => {
  const {
    language = "en",
    page = 1,
    limit = 10,
    category,
    subcategory,
    search,
    sort = "latest",
    featured,
    trending,
  } = req.query;

  const result = await newsService.getPublicNews({
    language,
    page,
    limit,
    category,
    subcategory,
    search,
    sort,
    featured: featured === "true",
    trending: trending === "true",
  });

  res.status(200).json({
    success: true,
    message: "News fetched successfully",
    data: result,
  });
};

const getHomepageData = async (req, res) => {
  const { language = "en" } = req.query;

  const result = await newsService.getHomepageData(language);

  res.status(200).json({
    success: true,
    message: "Homepage data fetched successfully",
    data: result,
  });
};


const getAdminNews = async (req, res) => {
  const {
    page = 1,
    limit = 10,
    status,
    category,
    search,
  } = req.query;

  const result = await newsService.getAdminNews({
    page,
    limit,
    status,
    category,
    search,
  });

  res.status(200).json({
    success: true,
    message: "Admin news fetched successfully",
    data: result,
  });
};

const incrementNewsViews = async (req, res) => {
  const { id } = req.params;
  const language = req.body?.language || "en";

  const views = await newsService.incrementNewsViews(
    id,
    language
  );

  res.status(200).json({
    success: true,
    message: "News view counted successfully",
    data: { views },
  });
};

module.exports = {
  createNews,
  updateNews,
  archiveNews,
  getAdminNewsById,
  getPublicNewsBySlug,
  getPublicNews,
  getAdminNews,
  incrementNewsViews,
  getHomepageData
};
