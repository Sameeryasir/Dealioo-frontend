import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import { getApiBaseUrl } from "@/app/lib/api";
import { clearAuthSession } from "@/app/lib/auth-session";
import { refreshAccessToken } from "@/app/lib/refresh-access-token";

type RetryableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

export const authAxios = axios.create({
  withCredentials: true,
});

authAxios.interceptors.request.use((config) => {
  config.baseURL = getApiBaseUrl();
  config.withCredentials = true;
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
        window.location.href = "/auth/login";
      }
      return Promise.reject(error);
    }

    return authAxios(original);
  },
);
