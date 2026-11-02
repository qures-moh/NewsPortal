import { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";

import { LanguageProvider } from "./context/LanguageContext";
import { SettingsProvider } from "./context/SettingsContext";

import Header from "./components/Header/Header";
import Navbar from "./components/Navbar/Navbar";
import Footer from "./components/Footer/Footer";

import Home from "./pages/Home/Home";
import Category from "./pages/Category/Category";
import Subcategory from "./pages/Subcategory/Subcategory";
import ArticleDetails from "./pages/ArticleDetails/ArticleDetails";
import Search from "./pages/Search/Search";
import NotFound from "./pages/NotFound/NotFound";

import "./App.css";

function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <BrowserRouter>
      <LanguageProvider>
        <SettingsProvider>
          <div className="app">
            <Header onMenuToggle={() => setIsMenuOpen((prev) => !prev)} />

            <Navbar isMenuOpen={isMenuOpen} onCloseMenu={closeMenu} />

            <main className="main-content">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/category/:slug" element={<Category />} />
                <Route path="/subcategory/:slug" element={<Subcategory />} />
                <Route path="/news/:language/:slug" element={<ArticleDetails />} />
                <Route path="/search" element={<Search />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>

            <Footer />

            <Toaster position="top-right" richColors />
          </div>
        </SettingsProvider>
      </LanguageProvider>
    </BrowserRouter>
  );
}

export default App;