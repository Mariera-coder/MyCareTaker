import { Mutex } from "async-mutex";
import {
  createApi,
  fetchBaseQuery,
  type BaseQueryApi,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from "@reduxjs/toolkit/query/react";
import { clearAuth } from "@/features/auth/authSlice";

const BASE_URL =
  import.meta.env.VITE_API_BASE_URL ??
  (import.meta.env.DEV ? "http://localhost:3028/api" : "/api");
const mutex = new Mutex();

const rawBaseQuery = fetchBaseQuery({
  baseUrl: BASE_URL,
  credentials: "include",
});

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);
const REAUTH_EXCLUDED_URLS = new Set([
  "/auth/csrf",
  "/auth/login",
  "/auth/logout",
  "/auth/refresh",
  "/auth/register",
]);

function readCookie(name: string): string | null {
  if (typeof document === "undefined") {
    return null;
  }

  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = document.cookie.match(new RegExp(`(?:^|; )${escapedName}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function getRequestMeta(args: string | FetchArgs) {
  if (typeof args === "string") {
    return { url: args, method: "GET" };
  }

  return {
    url: args.url,
    method: (args.method ?? "GET").toUpperCase(),
  };
}

function withCsrfHeader(args: string | FetchArgs): string | FetchArgs {
  const csrfToken = readCookie("inkahome_csrf_token");
  if (!csrfToken) {
    return args;
  }

  if (typeof args === "string") {
    return {
      url: args,
      headers: {
        "x-csrf-token": csrfToken,
      },
    };
  }

  const headers = new Headers();
  if (args.headers instanceof Headers) {
    args.headers.forEach((value, key) => headers.set(key, value));
  } else if (Array.isArray(args.headers)) {
    args.headers.forEach(([key, value]) => {
      if (typeof value === "string") {
        headers.set(key, value);
      }
    });
  } else if (args.headers) {
    Object.entries(args.headers).forEach(([key, value]) => {
      if (typeof value === "string") {
        headers.set(key, value);
      }
    });
  }
  headers.set("x-csrf-token", csrfToken);
  return {
    ...args,
    headers,
  };
}

let csrfRequest: Promise<void> | null = null;

async function ensureCsrfCookie(
  api: BaseQueryApi,
  extraOptions: Record<string, unknown> | undefined,
): Promise<void> {
  if (readCookie("inkahome_csrf_token")) {
    return;
  }

  if (!csrfRequest) {
    csrfRequest = (async () => {
      await rawBaseQuery("/auth/csrf", api, extraOptions ?? {});
    })().finally(() => {
      csrfRequest = null;
    });
  }

  await csrfRequest;
}

const baseQueryWithReauth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions,
) => {
  const { url, method } = getRequestMeta(args);

  if (!SAFE_METHODS.has(method) && url !== "/auth/csrf") {
    await ensureCsrfCookie(api, extraOptions);
  }

  await mutex.waitForUnlock();
  let result = await rawBaseQuery(withCsrfHeader(args), api, extraOptions);

  if (result.error?.status === 401 && !REAUTH_EXCLUDED_URLS.has(url)) {
    if (!mutex.isLocked()) {
      const release = await mutex.acquire();
      try {
        await ensureCsrfCookie(api, extraOptions);
        const refreshResult = await rawBaseQuery(
          withCsrfHeader({
            url: "/auth/refresh",
            method: "POST",
          }),
          api,
          extraOptions,
        );

        if (refreshResult.data) {
          result = await rawBaseQuery(withCsrfHeader(args), api, extraOptions);
        } else {
          api.dispatch(clearAuth());
        }
      } finally {
        release();
      }
    } else {
      await mutex.waitForUnlock();
      result = await rawBaseQuery(withCsrfHeader(args), api, extraOptions);
    }
  }

  if (result.error?.status === 401) {
    api.dispatch(clearAuth());
  }

  return result;
};

export const apiClient = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Users", "Estates", "Units", "Complaints", "Reports", "PendingRegistrations"],
  endpoints: () => ({}),
});
