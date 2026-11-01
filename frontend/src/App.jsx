import { useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";

import { Toaster } from "sonner";

import { LanguageProvider } from "./context/LanguageContext";

import Header from "./components/Header/Header";
import Navbar from "./components/Navbar/Navbar";

import Home from "./pages/Home/Home";
import Category from "./pages/Category/Category";
import ArticleDetails from "./pages/ArticleDetails/ArticleDetails";
import Search from "./pages/Search/Search";
import Subcategory from "./pages/Subcategory/Subcategory";

import "./App.css";

function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <BrowserRouter>
      <LanguageProvider>
        <div className="app">
          <Header
            onMenuToggle={() =>
              setIsMenuOpen((previous) => !previous)
            }
          />

          <Navbar
            isMenuOpen={isMenuOpen}
            onCloseMenu={closeMenu}
          />

          <main className="container">
          <Routes>
  <Route path="/" element={<Home />} />
  <Route path="/category/:slug" element={<Category />} />
  <Route path="/subcategory/:slug" element={<Subcategory />} />
  <Route
    path="/news/:language/:slug"
    element={<ArticleDetails />}
  />
  <Route path="/search" element={<Search />} />
</Routes>
          </main>

          <Toaster
            position="top-right"
            richColors
          />
        </div>
      </LanguageProvider>
    </BrowserRouter>
  );
}

export default App;