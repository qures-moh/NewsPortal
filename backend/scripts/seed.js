require("dotenv").config();

const mongoose = require("mongoose");
const connectDB = require("../config/database");

const User = require("../models/User");
const Category = require("../models/Category");
const Subcategory = require("../models/Subcategory");
const Tag = require("../models/Tag");
const News = require("../models/News");
const Advertisement = require("../models/Advertisement");
const WebsiteSettings = require("../models/WebsiteSettings");

// ==========================================
// CONFIGURATION & HELPERS
// ==========================================

const DEMO_PASSWORD =
  process.env.SEED_DEMO_PASSWORD || "DemoUserPassword123!";

const IMAGE = (id, width = 1200) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=80`;

const daysAgo = (days) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
};

const daysFromNow = (days) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
};

const makeSlug = (value) =>
  value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

// ==========================================
// DEMO VIDEOS
// ==========================================

const demoVideos = [
  {
    url: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
    alt: "Nature demonstration video",
  },
  {
    url: "https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    alt: "Animated demonstration video",
  },
  {
    url: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
    alt: "Travel demonstration video",
  },
  {
    url: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
    alt: "Entertainment demonstration video",
  },
];

// ==========================================
// GET EXISTING ADMIN
// ==========================================

const getAdmin = async () => {
  const admin = await User.findOne({
    role: "admin",
    isActive: true,
  }).sort({ createdAt: 1 });

  if (!admin) {
    throw new Error(
      "No active admin found. Create an admin account before running the seed script."
    );
  }

  console.log("Using existing admin:", admin.email);

  return admin;
};

// ==========================================
// SEED USERS
// ==========================================

const seedUsers = async () => {
  console.log("Seeding users...");

  const users = [];

  for (let i = 1; i <= 15; i++) {
    const email = `demo.user${String(i).padStart(2, "0")}@example.test`;

    let user = await User.findOne({ email });

    if (!user) {
      user = new User({
        name: `Demo User ${i}`,
        email,
        password: DEMO_PASSWORD,
        role: "user",
        isActive: i % 5 !== 0,
        isEmailVerified: true,
        lastLogin: daysAgo(i),
      });
    } else {
      user.name = `Demo User ${i}`;
      user.role = "user";
      user.isActive = i % 5 !== 0;
      user.isEmailVerified = true;
      user.lastLogin = daysAgo(i);
    }

    // Existing passwords are never overwritten.
    await user.save();

    users.push(user);
  }

  console.log(`Users seeded: ${users.length}`);

  return users;
};

// ==========================================
// CATEGORY DATA
// ==========================================

const categoryData = [
  {
    name: { en: "Politics", hi: "राजनीति" },
    slug: { en: "politics", hi: "राजनीति" },
    description: {
      en: "Latest political news and government updates.",
      hi: "राजनीति और सरकार से जुड़ी ताजा खबरें।",
    },
    image: "photo-1529107386315-e1a2ed48a620",
  },
  {
    name: { en: "Technology", hi: "टेक्नोलॉजी" },
    slug: { en: "technology", hi: "टेक्नोलॉजी" },
    description: {
      en: "Technology, gadgets, AI and digital innovation.",
      hi: "टेक्नोलॉजी, गैजेट्स और डिजिटल दुनिया की खबरें।",
    },
    image: "photo-1519389950473-47ba0277781c",
  },
  {
    name: { en: "Sports", hi: "खेल" },
    slug: { en: "sports", hi: "खेल" },
    description: {
      en: "Sports news, cricket and international tournaments.",
      hi: "खेल, क्रिकेट और अंतरराष्ट्रीय टूर्नामेंट की खबरें।",
    },
    image: "photo-1461896836934-ffe607ba8211",
  },
  {
    name: { en: "Business", hi: "बिजनेस" },
    slug: { en: "business", hi: "बिजनेस" },
    description: {
      en: "Business, markets, finance and economy.",
      hi: "बिजनेस, बाजार और अर्थव्यवस्था की खबरें।",
    },
    image: "photo-1460925895917-afdab827c52f",
  },
  {
    name: { en: "Entertainment", hi: "मनोरंजन" },
    slug: { en: "entertainment", hi: "मनोरंजन" },
    description: {
      en: "Movies, celebrities and entertainment updates.",
      hi: "फिल्मों और मनोरंजन जगत की खबरें।",
    },
    image: "photo-1489599849927-2ee91cede3ba",
  },
  {
    name: { en: "Education", hi: "शिक्षा" },
    slug: { en: "education", hi: "शिक्षा" },
    description: {
      en: "Education, exams, results and career updates.",
      hi: "शिक्षा, परीक्षा और करियर से जुड़ी खबरें।",
    },
    image: "photo-1434030216411-0b793f4b4173",
  },
  {
    name: { en: "Health", hi: "स्वास्थ्य" },
    slug: { en: "health", hi: "स्वास्थ्य" },
    description: {
      en: "Health, wellness and medical developments.",
      hi: "स्वास्थ्य और चिकित्सा से जुड़ी खबरें।",
    },
    image: "photo-1505751172876-fa1923c5c528",
  },
  {
    name: { en: "World", hi: "विश्व" },
    slug: { en: "world", hi: "विश्व" },
    description: {
      en: "International news and global developments.",
      hi: "दुनिया भर की प्रमुख खबरें।",
    },
    image: "photo-1451187580459-43490279c0fa",
  },
];

// ==========================================
// SEED CATEGORIES
// ==========================================

const seedCategories = async (admin) => {
  console.log("Seeding categories...");

  const categories = [];

  for (let i = 0; i < categoryData.length; i++) {
    const data = categoryData[i];

    let category = await Category.findOne({
      "slug.en": data.slug.en,
    });

    if (!category) {
      category = new Category();
    }

    category.name = data.name;
    category.slug = data.slug;
    category.description = data.description;
    category.image = IMAGE(data.image);
    category.isActive = true;
    category.displayOrder = i + 1;
    category.createdBy = category.createdBy || admin._id;
    category.updatedBy = admin._id;

    await category.save();

    categories.push(category);
  }

  console.log(`Categories seeded: ${categories.length}`);

  return categories;
};

// ==========================================
// SUBCATEGORY DATA
// ==========================================

const subcategoryNames = [
  [
    ["National Politics", "राष्ट्रीय राजनीति"],
    ["State Politics", "राज्य राजनीति"],
  ],
  [
    ["Artificial Intelligence", "आर्टिफिशियल इंटेलिजेंस"],
    ["Gadgets", "गैजेट्स"],
  ],
  [
    ["Cricket", "क्रिकेट"],
    ["Football", "फुटबॉल"],
  ],
  [
    ["Stock Market", "शेयर बाजार"],
    ["Startups", "स्टार्टअप"],
  ],
  [
    ["Bollywood", "बॉलीवुड"],
    ["Television", "टेलीविजन"],
  ],
  [
    ["Examinations", "परीक्षाएं"],
    ["Results", "रिजल्ट"],
  ],
  [
    ["Fitness", "फिटनेस"],
    ["Medical Research", "चिकित्सा अनुसंधान"],
  ],
  [
    ["Asia", "एशिया"],
    ["International Affairs", "अंतरराष्ट्रीय मामले"],
  ],
];

// ==========================================
// SEED SUBCATEGORIES
// ==========================================

const seedSubcategories = async (categories, admin) => {
  console.log("Seeding subcategories...");

  const subcategories = [];

  for (let i = 0; i < categories.length; i++) {
    const category = categories[i];

    for (const [index, names] of subcategoryNames[i].entries()) {
      const [englishName, hindiName] = names;

      const englishSlug = englishName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

      const hindiSlug = `${category.slug.hi}-${index + 1}`;

      let subcategory = await Subcategory.findOne({
        category: category._id,
        "slug.en": englishSlug,
      });

      if (!subcategory) {
        subcategory = new Subcategory();
      }

      subcategory.name = {
        en: englishName,
        hi: hindiName,
      };

      subcategory.slug = {
        en: englishSlug,
        hi: hindiSlug,
      };

      subcategory.description = {
        en: `Latest ${englishName.toLowerCase()} updates and news.`,
        hi: `${hindiName} से जुड़ी ताजा खबरें।`,
      };

      subcategory.category = category._id;
      subcategory.isActive = true;
      subcategory.displayOrder = index + 1;
      subcategory.createdBy =
        subcategory.createdBy || admin._id;
      subcategory.updatedBy = admin._id;

      await subcategory.save();

      subcategories.push(subcategory);
    }
  }

  console.log(`Subcategories seeded: ${subcategories.length}`);

  return subcategories;
};

// ==========================================
// TAG DATA
// ==========================================

const tagData = [
  ["Breaking News", "ब्रेकिंग न्यूज़"],
  ["Latest News", "ताजा खबर"],
  ["India", "भारत"],
  ["Madhya Pradesh", "मध्य प्रदेश"],
  ["Ujjain", "उज्जैन"],
  ["Indore", "इंदौर"],
  ["Politics", "राजनीति"],
  ["Technology", "टेक्नोलॉजी"],
  ["Artificial Intelligence", "आर्टिफिशियल इंटेलिजेंस"],
  ["Cricket", "क्रिकेट"],
  ["Business", "बिजनेस"],
  ["Education", "शिक्षा"],
  ["Health", "स्वास्थ्य"],
  ["Entertainment", "मनोरंजन"],
  ["World News", "विश्व समाचार"],
  ["Economy", "अर्थव्यवस्था"],
  ["Startup", "स्टार्टअप"],
  ["Government", "सरकार"],
  ["Digital India", "डिजिटल इंडिया"],
  ["Sports", "खेल"],
];

// ==========================================
// SEED TAGS
// ==========================================

const seedTags = async (admin) => {
  console.log("Seeding tags...");

  const tags = [];

  for (const [englishName, hindiName] of tagData) {
    const englishSlug = englishName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    const hindiSlug = `tag-${englishSlug}`;

    let tag = await Tag.findOne({
      "slug.en": englishSlug,
    });

    if (!tag) {
      tag = new Tag();
    }

    tag.name = {
      en: englishName,
      hi: hindiName,
    };

    tag.slug = {
      en: englishSlug,
      hi: hindiSlug,
    };

    tag.description = {
      en: `News and updates about ${englishName}.`,
      hi: `${hindiName} से जुड़ी खबरें और अपडेट।`,
    };

    tag.isActive = true;
    tag.createdBy = tag.createdBy || admin._id;
    tag.updatedBy = admin._id;

    await tag.save();

    tags.push(tag);
  }

  console.log(`Tags seeded: ${tags.length}`);

  return tags;
};

// ==========================================
// NEWS TEMPLATES
// ==========================================

const newsTemplates = [
  {
    category: "Politics",
    subcategory: "National Politics",
    title: "Government Announces New Development Initiatives",
    titleHi: "सरकार ने नई विकास योजनाओं की घोषणा की",
    excerpt:
      "The government has announced several initiatives focused on infrastructure and public development.",
    excerptHi:
      "सरकार ने बुनियादी ढांचे और सार्वजनिक विकास पर केंद्रित कई योजनाओं की घोषणा की है।",
    tags: ["government", "india", "politics"],
    image: "photo-1529107386315-e1a2ed48a620",
  },
  {
    category: "Technology",
    subcategory: "Artificial Intelligence",
    title: "Artificial Intelligence Is Transforming Indian Businesses",
    titleHi: "आर्टिफिशियल इंटेलिजेंस बदल रहा है भारतीय कारोबार",
    excerpt:
      "Businesses are adopting AI tools to improve productivity and customer experience.",
    excerptHi:
      "कारोबार उत्पादकता और ग्राहक अनुभव बेहतर बनाने के लिए एआई टूल अपना रहे हैं।",
    tags: ["technology", "artificial-intelligence", "digital-india"],
    image: "photo-1677442136019-21780ecad995",
  },
  {
    category: "Sports",
    subcategory: "Cricket",
    title: "Indian Cricket Team Begins Preparation for Upcoming Series",
    titleHi: "भारतीय क्रिकेट टीम ने आगामी सीरीज की तैयारी शुरू की",
    excerpt:
      "The Indian team has started its preparations ahead of the upcoming international series.",
    excerptHi:
      "भारतीय टीम ने आगामी अंतरराष्ट्रीय सीरीज से पहले अपनी तैयारी शुरू कर दी है।",
    tags: ["cricket", "sports", "india"],
    image: "photo-1531415074968-036ba1b575da",
  },
  {
    category: "Business",
    subcategory: "Stock Market",
    title: "Indian Markets Show Positive Movement",
    titleHi: "भारतीय बाजार में सकारात्मक तेजी देखने को मिली",
    excerpt:
      "Market activity remained positive as investors tracked major economic developments.",
    excerptHi:
      "निवेशकों की नजर प्रमुख आर्थिक घटनाक्रमों पर रहने के बीच बाजार में सकारात्मक रुख देखा गया।",
    tags: ["business", "economy", "india"],
    image: "photo-1611974789855-9c2a0a7236a3",
  },
  {
    category: "Entertainment",
    subcategory: "Bollywood",
    title: "New Film Releases Attract Audience Attention",
    titleHi: "नई फिल्मों की रिलीज ने दर्शकों का ध्यान खींचा",
    excerpt:
      "Upcoming film releases are generating interest among movie lovers.",
    excerptHi:
      "आने वाली फिल्मों की रिलीज को लेकर दर्शकों में उत्साह देखा जा रहा है।",
    tags: ["entertainment", "latest-news"],
    image: "photo-1489599849927-2ee91cede3ba",
  },
  {
    category: "Education",
    subcategory: "Examinations",
    title: "Students Prepare for Upcoming Competitive Examinations",
    titleHi: "छात्र आगामी प्रतियोगी परीक्षाओं की तैयारी में जुटे",
    excerpt:
      "Students are focusing on preparation strategies and updated examination patterns.",
    excerptHi:
      "छात्र तैयारी की रणनीतियों और परीक्षा पैटर्न पर ध्यान दे रहे हैं।",
    tags: ["education", "india", "latest-news"],
    image: "photo-1434030216411-0b793f4b4173",
  },
  {
    category: "Health",
    subcategory: "Fitness",
    title: "Experts Highlight the Importance of Daily Physical Activity",
    titleHi: "विशेषज्ञों ने रोजाना शारीरिक गतिविधि का महत्व बताया",
    excerpt:
      "Regular physical activity can support overall health and wellbeing.",
    excerptHi:
      "नियमित शारीरिक गतिविधि बेहतर स्वास्थ्य और फिटनेस में मदद कर सकती है।",
    tags: ["health", "fitness", "latest-news"],
    image: "photo-1505751172876-fa1923c5c528",
  },
  {
    category: "World",
    subcategory: "Asia",
    title: "Asian Nations Discuss Regional Cooperation",
    titleHi: "एशियाई देशों ने क्षेत्रीय सहयोग पर चर्चा की",
    excerpt:
      "Regional representatives discussed opportunities for cooperation and development.",
    excerptHi:
      "क्षेत्रीय प्रतिनिधियों ने सहयोग और विकास के अवसरों पर चर्चा की।",
    tags: ["world-news", "india", "latest-news"],
    image: "photo-1451187580459-43490279c0fa",
  },
];

// ==========================================
// SEED NEWS ARTICLES
// ==========================================

const seedNews = async (categories, subcategories, admin) => {
  console.log("Seeding news with images and videos...");

  const newsArticles = [];

  for (let i = 0; i < 30; i++) {
    const template = newsTemplates[i % newsTemplates.length];

    const category = categories.find(
      (item) => item.name.en === template.category
    );

    if (!category) {
      throw new Error(`Category missing: ${template.category}`);
    }

    const subcategory = subcategories.find(
      (item) =>
        item.name.en === template.subcategory &&
        item.category.toString() === category._id.toString()
    );

    if (!subcategory) {
      throw new Error(`Subcategory missing: ${template.subcategory}`);
    }

    const sequence = String(i + 1).padStart(2, "0");

    const englishTitle =
      i < newsTemplates.length
        ? template.title
        : `${template.title} - Update ${sequence}`;

    const hindiTitle =
      i < newsTemplates.length
        ? template.titleHi
        : `${template.titleHi} - अपडेट ${sequence}`;

    // Most records are published so the public homepage has content.
    const statusSlot = i % 12;

    const status =
      statusSlot === 8
        ? "draft"
        : statusSlot === 9
          ? "scheduled"
          : statusSlot === 11
            ? "archived"
            : "published";

    const publishedAt =
      status === "published" || status === "archived"
        ? daysAgo(i + 1)
        : null;

    const scheduledAt =
      status === "scheduled" ? daysFromNow(i + 2) : null;

    let article = await News.findOne({
      "title.en.title": englishTitle,
    });

    if (!article) {
      article = new News();
    }

    const articleSlug = `${makeSlug(template.title)}-${sequence}`;

    // Localized article data structure:
    // title.en.title, title.en.excerpt, title.en.content, title.en.slug
    article.title = {
      en: {
        title: englishTitle,
        excerpt: `${template.excerpt} This is demo article ${sequence}.`,
        content: `<p>${template.excerpt}</p><p>This is demo news content. Article reference: ${sequence}.</p>`,
        slug: articleSlug,
      },
      hi: {
        title: hindiTitle,
        excerpt: `${template.excerptHi} यह डेमो समाचार ${sequence} है।`,
        content: `<p>${template.excerptHi}</p><p>यह समाचार पोर्टल के लिए डेमो लेख है। लेख संख्या: ${sequence}।</p>`,
        slug: articleSlug,
      },
    };

    article.availableLanguages = ["en", "hi"];

    article.category = category._id;
    article.subcategory = subcategory._id;

    article.thumbnail = IMAGE(template.image);

    article.thumbnailAlt = {
      en: `${template.category} news`,
      hi: `${template.category} समाचार`,
    };

    // MEDIA: VIDEOS + IMAGES

    const media = [];

    if (i % 2 === 0) {
      const videoIndex =
        Math.floor(i / 2) % demoVideos.length;

      const video = demoVideos[videoIndex];

      media.push({
        type: "video",
        url: video.url,
        alt: video.alt,
        order: 1,
      });
    }

    if (i % 3 === 0) {
      media.push({
        type: "image",
        url: IMAGE(template.image),
        alt: `${template.category} news image`,
        order: media.length + 1,
      });
    }

    article.media = media;

    article.author = admin._id;
    article.createdBy = article.createdBy || admin._id;
    article.updatedBy = admin._id;

    // Your News schema stores tags as strings.
    article.tags = template.tags;

    article.status = status;
    article.publishedAt = publishedAt;
    article.scheduledAt = scheduledAt;

    article.isFeatured = i % 5 === 0;
    article.isBreaking = i % 7 === 0;
    article.isTrending = i % 3 === 0;

    article.seo = {
      en: {
        title: englishTitle,
        description: template.excerpt,
      },
      hi: {
        title: hindiTitle,
        description: template.excerptHi,
      },
    };

    await article.save();

    newsArticles.push(article);
  }

  const articlesWithVideos = newsArticles.filter(
    (article) =>
      article.media.some((item) => item.type === "video")
  ).length;

  const totalVideos = newsArticles.reduce(
    (total, article) =>
      total +
      article.media.filter((item) => item.type === "video").length,
    0
  );

  const totalImages = newsArticles.reduce(
    (total, article) =>
      total +
      article.media.filter((item) => item.type === "image").length,
    0
  );

  console.log(`News articles: ${newsArticles.length}`);
  console.log(`Articles with videos: ${articlesWithVideos}`);
  console.log(`Total video records: ${totalVideos}`);
  console.log(`Additional image records: ${totalImages}`);

  return newsArticles;
};

// ==========================================
// ADVERTISEMENT DATA
// ==========================================

const advertisementData = [
  {
    name: "Homepage Top Banner",
    placement: { page: "homepage", position: "top" },
    devices: ["desktop", "mobile"],
    image: "photo-1497366754035-f200968a6e72",
  },
  {
    name: "Homepage Middle Banner",
    placement: { page: "homepage", position: "middle" },
    devices: ["desktop"],
    image: "photo-1557683316-973673baf926",
  },
  {
    name: "Article Top Banner",
    placement: { page: "article", position: "top" },
    devices: ["desktop", "mobile"],
    image: "photo-1460925895917-afdab827c52f",
  },
  {
    name: "Article Bottom Banner",
    placement: { page: "article", position: "bottom" },
    devices: ["desktop"],
    image: "photo-1553877522-43269d4ea984",
  },
  {
    name: "Category Middle Banner",
    placement: { page: "category", position: "middle" },
    devices: ["desktop", "mobile"],
    image: "photo-1519389950473-47ba0277781c",
  },
  {
    name: "Category Bottom Banner",
    placement: { page: "category", position: "bottom" },
    devices: ["mobile"],
    image: "photo-1486406146926-c627a92ad1ab",
  },
];

// ==========================================
// SEED ADVERTISEMENTS
// ==========================================

const seedAdvertisements = async (admin) => {
  console.log("Seeding advertisements...");

  const advertisements = [];

  for (const data of advertisementData) {
    let advertisement = await Advertisement.findOne({
      name: data.name,
    });

    if (!advertisement) {
      advertisement = new Advertisement();
    }

    advertisement.name = data.name;
    advertisement.bannerImage = IMAGE(data.image);
    advertisement.destinationUrl = "https://example.com";
    advertisement.placement = data.placement;
    advertisement.devices = data.devices;
    advertisement.startAt = daysAgo(5);
    advertisement.endAt = daysFromNow(30);
    advertisement.isActive = true;

    advertisement.createdBy =
      advertisement.createdBy || admin._id;

    advertisement.updatedBy = admin._id;

    await advertisement.save();

    advertisements.push(advertisement);
  }

  console.log(`Advertisements seeded: ${advertisements.length}`);

  return advertisements;
};

// ==========================================
// WEBSITE SETTINGS
// ==========================================

const seedWebsiteSettings = async (admin) => {
  console.log("Seeding website settings...");

  let settings = await WebsiteSettings.findOne({
    siteKey: "main",
  });

  if (!settings) {
    settings = new WebsiteSettings({
      siteKey: "main",
    });
  }

  settings.websiteName = {
    en: "News Portal",
    hi: "न्यूज़ पोर्टल",
  };

  settings.branding = {
    logo: {
      url: IMAGE("photo-1495020689067-958852a7765e", 400),
      isVisible: true,
    },
    mobileLogo: {
      url: IMAGE("photo-1495020689067-958852a7765e", 300),
      isVisible: true,
    },
    footerLogo: {
      url: IMAGE("photo-1495020689067-958852a7765e", 400),
      isVisible: true,
    },
    favicon: {
      url: "",
      isVisible: true,
    },
  };

  settings.contact = {
    mobile: {
      value: "+919876543210",
      isVisible: true,
    },
    whatsapp: {
      value: "+919876543210",
      isVisible: true,
    },
    email: {
      value: "contact@example.com",
      isVisible: true,
    },
    address: {
      value: {
        en: "Ujjain, Madhya Pradesh, India",
        hi: "उज्जैन, मध्य प्रदेश, भारत",
      },
      isVisible: true,
    },
    showContactInFooter: true,
    showFloatingWhatsapp: true,
  };

  settings.socialLinks = [
    {
      platform: "facebook",
      url: "https://facebook.com",
      isActive: true,
      showInHeader: true,
      showInFooter: true,
    },
    {
      platform: "instagram",
      url: "https://instagram.com",
      isActive: true,
      showInHeader: true,
      showInFooter: true,
    },
    {
      platform: "youtube",
      url: "https://youtube.com",
      isActive: true,
      showInHeader: false,
      showInFooter: true,
    },
    {
      platform: "whatsapp",
      url: "https://wa.me/919876543210",
      isActive: true,
      showInHeader: false,
      showInFooter: true,
    },
  ];

  settings.socialDisplay = {
    showInHeader: true,
    showInFooter: true,
  };

  settings.updatedBy = admin._id;

  await settings.save();

  console.log("Website settings seeded.");

  return settings;
};

// ==========================================
// MAIN SEED FUNCTION
// ==========================================

const seedDatabase = async () => {
  try {
    console.log("\nStarting demo data seeding...\n");

    await connectDB();

    // Preserve the existing admin account.
    const admin = await getAdmin();

    await seedUsers();

    const categories = await seedCategories(admin);

    const subcategories = await seedSubcategories(
      categories,
      admin
    );

    await seedTags(admin);

    await seedNews(
      categories,
      subcategories,
      admin
    );

    await seedAdvertisements(admin);

    await seedWebsiteSettings(admin);

    console.log("\n=================================");
    console.log("DEMO DATA SEEDING COMPLETED");
    console.log("=================================");

    console.log("Existing admin: Preserved");
    console.log("Demo users: 15");
    console.log("Categories: 8");
    console.log("Subcategories: 16");
    console.log("Tags: 20");
    console.log("News articles: 30");
    console.log("Video records: 15");
    console.log("Advertisements: 6");
    console.log("Website settings: 1");
  } catch (error) {
    console.error("\nSeed failed:", error.message);
    console.error(error.stack);

    process.exitCode = 1;
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
      console.log("MongoDB connection closed.");
    }
  }
};

seedDatabase();