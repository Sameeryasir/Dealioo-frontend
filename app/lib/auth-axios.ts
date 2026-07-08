import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import { getApiBaseUrl } from "@/app/lib/api";
import {
  clearAuthSession,
  getSetupAccessToken,
} from "@/app/lib/auth-session";
import { refreshAccessToken } from "@/app/lib/refresh-access-token";

type RetryableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

export const authAxios = axios.create();

authAxios.interceptors.request.use((config) => {
  config.baseURL = getApiBaseUrl();
  const token = getSetupAccessToken().trim();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (config.data instanceof FormData) {
    config.headers.delete("Content-Type");
  }
  return config;
});

authAxios.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetryableRequestConfig | undefined;
    if (!original || error.response?.status !== 401 || original._retry) {
      return Promise.reject(error);
    }

    original._retry = true;
    const newToken = await refreshAccessToken();

    if (!newToken) {
      clearAuthSession();
      if (typeof window !== "undefined") {
        const returnTo = encodeURIComponent(
          `${window.location.pathname}${window.location.search}`,
        );
        window.location.href = `/?returnTo=${returnTo}`;
      }
      return Promise.reject(error);
    }

    original.headers.Authorization = `Bearer ${newToken}`;
    return authAxios(original);
  },
);
