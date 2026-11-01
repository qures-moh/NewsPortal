
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  Newspaper,
} from "lucide-react";

import { loginAdmin, clearAuthError } from "../../features/auth/authSlice";
import "./Login.css";

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { loading, error } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [fieldErrors, setFieldErrors] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [validationError, setValidationError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }

    setValidationError("");

    if (error) {
      dispatch(clearAuthError());
    }
  };

  const validate = () => {
    const errors = { email: "", password: "" };
    let isValid = true;
    const email = formData.email.trim().toLowerCase();

    if (!email) {
      errors.email = "Email address is required.";
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = "Please enter a valid email address.";
      isValid = false;
    }

    if (!formData.password) {
      errors.password = "Password is required.";
      isValid = false;
    } else if (formData.password.length < 6) {
      errors.password = "Password must be at least 6 characters.";
      isValid = false;
    }

    setFieldErrors(errors);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) {
      toast.warning("Please correct the errors in the form.");
      return;
    }

    const email = formData.email.trim().toLowerCase();
    setValidationError("");
    dispatch(clearAuthError());

    try {
      await dispatch(
        loginAdmin({
          email,
          password: formData.password,
        })
      ).unwrap();

      toast.success("Login successful!");
      navigate("/dashboard", { replace: true });
    } catch (err) {
      const message =
        typeof err === "string" ? err : "Login failed. Please try again.";

      toast.error(message);
    }
  };

  return (
    <main className="login-page">
      <section className="login-brand-panel">
        <div className="login-brand-content">
          <div className="login-brand-logo">
            <Newspaper size={30} strokeWidth={2.2} />
          </div>

          <h1>NewsPortal</h1>

          <p className="login-brand-description">
            Your newsroom. Your stories. Your platform.
          </p>

          <div className="login-brand-footer">
            <span>NEWS PORTAL MANAGEMENT SYSTEM</span>
          </div>
        </div>
      </section>

      <section className="login-form-panel">
        <div className="login-card">
          <div className="login-mobile-logo">
            <Newspaper size={27} />
            <span>NewsPortal</span>
          </div>

          <div className="login-heading">
            <span className="login-eyebrow">ADMINISTRATION</span>
            <h2>Welcome back</h2>
            <p>Sign in to manage your news portal.</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            <div className="login-field">
              <label htmlFor="email">
                Email address <span className="field-required-mark">*</span>
              </label>

              <div
                className={`login-input-wrapper ${
                  fieldErrors.email ? "has-error" : ""
                }`}
              >
                <Mail size={19} />

                <input
                  id="email"
                  type="email"
                  name="email"
                  placeholder="admin@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  autoComplete="username"
                  disabled={loading}
                />
              </div>

              {fieldErrors.email && (
                <span className="login-field-error" role="alert">
                  {fieldErrors.email}
                </span>
              )}
            </div>

            <div className="login-field">
              <label htmlFor="password">
                Password <span className="field-required-mark">*</span>
              </label>

              <div
                className={`login-input-wrapper ${
                  fieldErrors.password ? "has-error" : ""
                }`}
              >
                <LockKeyhole size={19} />

                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  autoComplete="current-password"
                  disabled={loading}
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  disabled={loading}
                >
                  {showPassword ? (
                    <EyeOff size={19} />
                  ) : (
                    <Eye size={19} />
                  )}
                </button>
              </div>

              {fieldErrors.password && (
                <span className="login-field-error" role="alert">
                  {fieldErrors.password}
                </span>
              )}
            </div>

            {(validationError || error) && (
              <div className="login-error" role="alert">
                {validationError || error}
              </div>
            )}

            <button
              type="submit"
              className="login-submit-button"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="login-spinner" />
                  Signing in...
                </>
              ) : (
                "Sign in to dashboard"
              )}
            </button>
          </form>

          <p className="login-security-note">
            Authorized administrators only.
          </p>
        </div>

        <footer className="login-footer">
          © {new Date().getFullYear()} NewsPortal. All rights reserved.
        </footer>
      </section>
    </main>
  );
};

export default Login;
