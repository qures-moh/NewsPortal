
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../services/api";

export const fetchAdminNews = createAsyncThunk(
  "news/fetchAdminNews",
  async (params = {}, { rejectWithValue }) => {
    try {
      const page = Math.max(1, Number(params.page) || 1);
      const limit = Math.min(100, Math.max(1, Number(params.limit) || 10));

      const response = await api.get("/news/admin/all", {
        params: {
          page,
          limit,
          search:
            typeof params.search === "string"
              ? params.search.trim()
              : "",
          status: params.status || "",
          category: params.category || "",
        },
      });

      if (!response.data?.success) {
        return rejectWithValue(
          response.data?.message || "Unable to fetch news"
        );
      }

      const data = response.data.data;

      return {
        news: data.news || [],
        pagination: {
          currentPage: Number(data.pagination?.page) || page,
          totalPages: Number(data.pagination?.totalPages) || 0,
          totalNews: Number(data.pagination?.total) || 0,
        },
      };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Failed to fetch news"
      );
    }
  }
);

const initialState = {
  news: [],
  pagination: {
    currentPage: 1,
    totalPages: 0,
    totalNews: 0,
  },
  loading: false,
  error: null,
};

const newsSlice = createSlice({
  name: "news",
  initialState,

  reducers: {
    clearNewsError: (state) => {
      state.error = null;
    },

    resetNews: (state) => {
      state.news = [];
      state.pagination = {
        currentPage: 1,
        totalPages: 0,
        totalNews: 0,
      };
      state.error = null;
      state.loading = false;
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(fetchAdminNews.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(fetchAdminNews.fulfilled, (state, action) => {
        state.loading = false;
        state.news = action.payload.news;
        state.pagination = action.payload.pagination;
        state.error = null;
      })

      .addCase(fetchAdminNews.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.payload ||
          action.error.message ||
          "Something went wrong";
      });
  },
});

export const { clearNewsError, resetNews } = newsSlice.actions;

export default newsSlice.reducer;
