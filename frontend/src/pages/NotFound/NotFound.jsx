import { Link } from "react-router-dom";
import { ArrowLeft, Home, Search } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";
import "./NotFound.css";

const NotFound = () => {
  const { language } = useLanguage();
  const isHindi = language === "hi";

  return (
    <div className="not-found-page">
      <div className="container not-found-inner">
        <span className="not-found-code">404</span>
        <h1 className="not-found-title">
          {isHindi ? "पृष्ठ नहीं मिला" : "Page Not Found"}
        </h1>
        <p className="not-found-desc">
          {isHindi
            ? "जिस पृष्ठ को आप खोज रहे हैं, वह स्थानांतरित हो चुका है या उपलब्ध नहीं है।"
            : "The page or story you are looking for may have been moved, archived, or does not exist."}
        </p>

        <div className="not-found-actions">
          <Link to="/" className="not-found-btn primary-btn">
            <Home size={16} />
            <span>{isHindi ? "होम पेज पर जाएं" : "Return to Homepage"}</span>
          </Link>
          <Link to="/search" className="not-found-btn secondary-btn">
            <Search size={16} />
            <span>{isHindi ? "समाचार खोजें" : "Search Dispatches"}</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
