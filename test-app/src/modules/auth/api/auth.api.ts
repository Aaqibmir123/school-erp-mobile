import { baseApi } from "@/src/store/api/baseApi";
import {
  clearBrowserSession,
  syncBrowserSession,
} from "@/src/modules/auth/utils/session";

import type {
  ApplySchoolDTO,
  LoginDTO,
  LoginResponse,
} from "@/shared-types/auth.types";

/** Matches backend Zod schema (confirmPassword stripped server-side after check). */
export type ApplySchoolRequestBody = ApplySchoolDTO & {
  confirmPassword: string;
};

type ApiEnvelope<T> = {
  data: T;
  message: string;
  success: boolean;
};

const normalizeLoginPhone = (value?: string) =>
  String(value || "")
    .trim()
    .replace(/\D/g, "")
    .slice(-10);

const clearToken = () => {
  clearBrowserSession();
};

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<LoginResponse, LoginDTO>({
      query: (body) => {
        const phone = normalizeLoginPhone(body.phone || body.emailOrPhone);

        return {
          url: "/auth/login",
          method: "POST",
          body: {
            password: String(body.password || ""),
            phone,
          },
        };
      },
      transformResponse: (response: ApiEnvelope<LoginResponse>) =>
        response.data,
      async onQueryStarted(_arg, { queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          syncBrowserSession({
            token: data.token,
            refreshToken: data.refreshToken,
            role: data.user?.role,
          });
        } catch {
          // Error handling happens in the UI layer.
        }
      },
      invalidatesTags: ["Auth"],
    }),

    refreshSession: builder.mutation<LoginResponse, void>({
      query: () => ({
        url: "/auth/refresh",
        method: "POST",
      }),
      transformResponse: (response: ApiEnvelope<LoginResponse>) =>
        response.data,
      async onQueryStarted(_arg, { queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          syncBrowserSession({
            token: data.token,
            refreshToken: data.refreshToken,
            role: data.user?.role,
          });
        } catch {
          clearToken();
        }
      },
      invalidatesTags: ["Auth"],
    }),

    getProfile: builder.query<LoginResponse, void>({
      query: () => ({
        url: "/auth/refresh",
        method: "POST",
      }),
      transformResponse: (response: ApiEnvelope<LoginResponse>) =>
        response.data,
      async onQueryStarted(_arg, { queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          syncBrowserSession({
            token: data.token,
            refreshToken: data.refreshToken,
            role: data.user?.role,
          });
        } catch {
          // No-op: profile request is used as a session bootstrap.
        }
      },
      keepUnusedDataFor: 300,
      providesTags: ["Auth"],
    }),

    logout: builder.mutation<{ loggedOut: boolean }, void>({
      query: () => ({
        url: "/auth/logout",
        method: "POST",
      }),
      transformResponse: (response: ApiEnvelope<{ loggedOut: boolean }>) =>
        response.data,
      async onQueryStarted(_arg, { queryFulfilled }) {
        try {
          await queryFulfilled;
        } finally {
          clearToken();
        }
      },
      invalidatesTags: ["Auth"],
    }),

    applySchool: builder.mutation<unknown, ApplySchoolRequestBody>({
      query: (body) => ({
        url: "/auth/apply-school",
        method: "POST",
        body,
      }),
      transformResponse: (response: ApiEnvelope<unknown>) => response.data,
    }),
  }),
});

export const {
  useApplySchoolMutation,
  useGetProfileQuery,
  useLoginMutation,
  useLogoutMutation,
  useRefreshSessionMutation,
} = authApi;
