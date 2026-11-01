
import { useState } from "react";
import { Search, Menu, UserRound } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import { useLanguage } from "../../context/LanguageContext";
import "./Header.css";

const Header = ({ onMenuToggle }) => {
  const { language, changeLanguage } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  const isHindi = language === "hi";

  const handleSearch = (e) => {
    e.preventDefault();

    const query = searchQuery.trim();
    if (!query) return;

    navigate(`/search?q=${encodeURIComponent(query)}`);
  };

  return (
    <header className="site-header">
      <div className="container header-inner">
        <button
          className="mobile-menu"
          type="button"
          onClick={onMenuToggle}
          aria-label={isHindi ? "मेन्यू खोलें" : "Toggle menu"}
        >
          <Menu size={23} />
        </button>

        <Link to="/" className="brand">
          <span className="brand-symbol">म</span>

          <span className="brand-name">
            {isHindi ? "मेरा समाचार" : "MERA SAMACHAR"}
            <small>
              {isHindi ? "देश की हर खबर" : "YOUR NEWS. YOUR VOICE."}
            </small>
          </span>
        </Link>

        <form className="header-search" onSubmit={handleSearch}>
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isHindi ? "खबर खोजें..." : "Search news..."}
            aria-label={isHindi ? "खबर खोजें" : "Search news"}
          />

          <button type="submit" aria-label="Search">
            <Search size={19} />
          </button>
        </form>

        <div className="header-actions">
          <div className="language-switch">
            <button
              type="button"
              className={language === "en" ? "active" : ""}
              onClick={() => changeLanguage("en")}
            >
              EN
            </button>

            <button
              type="button"
              className={language === "hi" ? "active" : ""}
              onClick={() => changeLanguage("hi")}
            >
              हिन्दी
            </button>
          </div>

          <button type="button" className="login-button">
            <UserRound size={17} />
            <span>{isHindi ? "लॉगिन" : "Login"}</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
