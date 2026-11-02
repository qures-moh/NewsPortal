
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../services/api";


export const loginAdmin = createAsyncThunk(
  "auth/loginAdmin",
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await api.post("/auth/login", credentials);
      const { accessToken, user } = response.data;

      if (!accessToken || !user) {
        return rejectWithValue("Invalid server response");
      }

      if (user.role !== "admin") {
        return rejectWithValue("Admin access only");
      }

      localStorage.setItem("accessToken", accessToken);

      return { accessToken, user };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Login failed"
      );
    }
  }
);


export const initializeAuth = createAsyncThunk(
  "auth/initializeAuth",
  async (_, { rejectWithValue }) => {
    const token = localStorage.getItem("accessToken");

    if (!token) {
      return rejectWithValue("No active session");
    }

    try {
      const response = await api.get("/auth/me");
      const user = response.data.user;

      if (!user || user.role !== "admin") {
        throw new Error("Admin access only");
      }

      return { token, user };
    } catch (error) {
      localStorage.removeItem("accessToken");

      return rejectWithValue(
        error.response?.data?.message || "Session expired"
      );
    }
  }
);

// Logout
export const logoutAdmin = createAsyncThunk(
  "auth/logoutAdmin",
  async () => {
    localStorage.removeItem("accessToken");
  }
);

const initialState = {
  token: null,
  user: null,
  isAuthenticated: false,
  loading: false,
  checkingSession: true,
  initialized: false,
  error: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,

  reducers: {
    clearAuthError: (state) => {
      state.error = null;
    },
  },

  extraReducers: (builder) => {
    builder
      // Login
      .addCase(loginAdmin.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginAdmin.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload.accessToken;
        state.user = action.payload.user;
        state.isAuthenticated = true;
        state.initialized = true;
      })
      .addCase(loginAdmin.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Login failed";
      })

    
      .addCase(initializeAuth.pending, (state) => {
        state.checkingSession = true;
      })
      .addCase(initializeAuth.fulfilled, (state, action) => {
        state.token = action.payload.token;
        state.user = action.payload.user;
        state.isAuthenticated = true;
        state.checkingSession = false;
        state.initialized = true;
      })
      .addCase(initializeAuth.rejected, (state) => {
        state.token = null;
        state.user = null;
        state.isAuthenticated = false;
        state.checkingSession = false;
        state.initialized = true;
      })

    
      .addCase(logoutAdmin.fulfilled, () => ({
        ...initialState,
        checkingSession: false,
        initialized: true,
      }));
  },
});

export const { clearAuthError } = authSlice.actions;

export default authSlice.reducer;
