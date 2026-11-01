import { useEffect } from "react";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";
import { useDispatch } from "react-redux";

import Login from "./pages/auth/Login";
import Dashboard from "./pages/dashboard/Dashboard";

import NewsList from "./pages/news/NewsList";
import CreateNews from "./pages/news/CreateNews";
import EditNews from "./pages/news/EditNews";

import MediaLibrary from "./pages/media/MediaLibrary";
import CategoryList from "./pages/categories/CategoryList";
import SubcategoryList from "./pages/subcategories/SubcategoryList";
import TagsList from "./pages/tags/TagsList";

import AdvertisementList from "./pages/advertisements/AdvertisementList";
import AdvertisementForm from "./pages/advertisements/AdvertisementForm";

import ProtectedRoute from "./components/protected/ProtectedRoute";
import AdminLayout from "./components/layout/AdminLayout";
import Users from "./pages/users/Users";
import { initializeAuth } from "./features/auth/authSlice";
import Settings from "./pages/settings/Settings";
function AppRoutes() {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(initializeAuth());
  }, [dispatch]);

  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AdminLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />

          <Route path="/news" element={<NewsList />} />
          <Route path="/news/create" element={<CreateNews />} />
          <Route path="/news/edit/:id" element={<EditNews />} />

          <Route path="/categories" element={<CategoryList />} />
          <Route path="/subcategories" element={<SubcategoryList />} />
          <Route path="/tags" element={<TagsList />} />

          <Route path="/media" element={<MediaLibrary />} />

          <Route
            path="/advertisements"
            element={<AdvertisementList />}
          />
          <Route
            path="/advertisements/create"
            element={<AdvertisementForm />}
          />
          <Route
            path="/advertisements/edit/:id"
            element={<AdvertisementForm />}
          />

          <Route path="/users" element={<Users />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Route>

      <Route
        path="/"
        element={<Navigate to="/dashboard" replace />}
      />

      <Route
        path="*"
        element={<Navigate to="/dashboard" replace />}
      />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;