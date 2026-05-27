// src/features/authSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Axios instance
const api = axios.create({
  //baseURL: "http://localhost:8000/api/v2/users",
  baseURL: `${import.meta.env.VITE_API_URL}/api/v2/users`,
  withCredentials: true,
});

// Attach token to every request
api.interceptors.request.use((config) => {
  const token =
    localStorage.getItem("accessToken") ||
    sessionStorage.getItem("accessToken");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: if a request fails with 401 (expired token),
// try refreshing once, then retry the original request.
// If refresh also fails, clear storage and reject.
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Only attempt refresh on 401, and only once (avoid infinite loop)
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      // Don't retry the refresh endpoint itself
      !originalRequest.url.includes("/refresh-token") &&
      // Don't retry logout — we handle that separately
      !originalRequest.url.includes("/logout")
    ) {
      originalRequest._retry = true;

      try {
        const refreshRes = await api.post("/refresh-token");
        const newToken = refreshRes.data.data.accessToken;

        // Respect original storage choice
        if (localStorage.getItem("accessToken")) {
          localStorage.setItem("accessToken", newToken);
        } else {
          sessionStorage.setItem("accessToken", newToken);
        }

        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed — clear everything
        localStorage.removeItem("accessToken");
        sessionStorage.removeItem("accessToken");
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Utility for safe error extraction
const extractError = (err, fallback = "Something went wrong") => {
  return err.response?.data?.message || err.message || fallback;
};

// Async thunks
export const registerUser = createAsyncThunk("auth/register", async (data, thunkAPI) => {
  try {
    const res = await api.post("/register", data);
    return res.data;
  } catch (err) {
    return thunkAPI.rejectWithValue({ message: extractError(err, "Registration failed") });
  }
});

export const loginUser = createAsyncThunk("auth/login", async (data, thunkAPI) => {
  try {
    const res = await api.post("/login", data);

    if (data.remember) {
      localStorage.setItem("accessToken", res.data.data.accessToken);
    } else {
      sessionStorage.setItem("accessToken", res.data.data.accessToken);
    }

    return res.data;
  } catch (err) {
    return thunkAPI.rejectWithValue({ message: extractError(err, "Login failed") });
  }
});

export const logoutUser = createAsyncThunk("auth/logout", async (_, thunkAPI) => {
  // Clear tokens from storage FIRST, before calling the backend.
  // This way, even if the backend call fails (e.g. token already expired),
  // the user is still logged out on the client side.
  localStorage.removeItem("accessToken");
  sessionStorage.removeItem("accessToken");

  try {
    // Best-effort server-side logout (invalidates refresh token cookie).
    // We use a plain axios call here (not the api instance) so the
    // interceptor doesn't try to attach the now-removed token.
    await axios.post(
      //"http://localhost:8000/api/v2/users/logout"
      `${import.meta.env.VITE_API_URL}/api/v2/users/logout`,
      {},
      { withCredentials: true }
    );
  } catch {
    // Silently ignore backend errors — client is already logged out.
  }

  return {};
});

export const getCurrentUser = createAsyncThunk("auth/currentUser", async (_, thunkAPI) => {
  try {
    const res = await api.get("/current-user");
    return res.data;
  } catch (err) {
    return thunkAPI.rejectWithValue({ message: extractError(err, "Failed to fetch current user") });
  }
});

export const refreshToken = createAsyncThunk("auth/refresh", async (_, thunkAPI) => {
  try {
    const res = await api.post("/refresh-token");
    const token = res.data.data.accessToken;

    if (localStorage.getItem("accessToken")) {
      localStorage.setItem("accessToken", token);
    } else {
      sessionStorage.setItem("accessToken", token);
    }

    return res.data;
  } catch (err) {
    return thunkAPI.rejectWithValue({ message: extractError(err, "Token refresh failed") });
  }
});

// Slice
const authSlice = createSlice({
  name: "auth",
  initialState: {
    user: null,
    accessToken: localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken") || null,
    loading: false,
    loggingOut: false, // separate flag so logout spinner doesn't affect other UI
    error: null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Register
      .addCase(registerUser.pending, (state) => { state.loading = true; })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.data;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload.message;
      })

      // Login
      .addCase(loginUser.pending, (state) => { state.loading = true; })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.data.user;
        state.accessToken = action.payload.data.accessToken;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload.message;
      })

      // Logout — use loggingOut flag, not loading
      .addCase(logoutUser.pending, (state) => {
        state.loggingOut = true;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.loggingOut = false;
        state.user = null;
        state.accessToken = null;
        state.error = null;
      })
      .addCase(logoutUser.rejected, (state) => {
        // Even on backend failure, clear client state
        state.loggingOut = false;
        state.user = null;
        state.accessToken = null;
        state.error = null;
      })

      // Get current user
      .addCase(getCurrentUser.pending, (state) => { state.loading = true; })
      .addCase(getCurrentUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.data;
      })
      .addCase(getCurrentUser.rejected, (state, action) => {
        state.loading = false;
        // Token is invalid/expired — clear it
        state.accessToken = null;
        state.error = action.payload?.message;
      })

      // Refresh token
      .addCase(refreshToken.fulfilled, (state, action) => {
        state.accessToken = action.payload.data.accessToken;
      })
      .addCase(refreshToken.rejected, (state) => {
        state.user = null;
        state.accessToken = null;
      });
  },
});

export const { clearError } = authSlice.actions;
export default authSlice.reducer;