import { baseApi } from "../../api/baseQuery";

type DashboardData = {
  attendance?: {
    absent?: number;
    percentage?: number;
    present?: number;
    todayStatus?: "PRESENT" | "ABSENT" | "N/A";
  };
  className?: string;
  nextClass?: {
    endTime?: string;
    startTime?: string;
    subject?: string;
    teacher?: string;
  } | null;
  sectionName?: string;
  stats?: {
    activeHomeworkCount?: number;
    pendingFeeCount?: number;
    upcomingExamCount?: number;
  };
  rollNumber?: number | null;
  studentName?: string;
};

export const studentApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    /* ================= TIMETABLE ================= */
    // ❌ studentId hata diya

    getTodayTimetable: builder.query<any[], void>({
      query: () => ({
        url: "/student/today",
      }),
      transformResponse: (res: any) => res?.data || [],
      providesTags: ["Timetable"],
    }),

    getWeeklyTimetable: builder.query<Record<string, any[]>, void>({
      query: () => ({
        url: "/student/weekly",
      }),
      transformResponse: (res: any) => res?.data || {},
      providesTags: ["Timetable"],
    }),

    /* ================= EXAMS ================= */
    // ✅ studentId required

    getStudentExams: builder.query<any[], { studentId: string }>({
      query: ({ studentId }) => ({
        url: "/student/exams",
        params: { studentId },
      }),
      transformResponse: (res: any) => res?.data || [],
      providesTags: ["Exam"],
    }),

    /* ================= MARKS ================= */

    getMyMarks: builder.query<any, { studentId: string }>({
      query: ({ studentId }) => ({
        url: "/result/marks-card",
        params: { studentId, approvedOnly: true },
      }),
      transformResponse: (res: any) => res?.data || {},
      providesTags: ["Results"],
    }),

    getClassTestRecords: builder.query<any[], { studentId: string }>({
      query: ({ studentId }) => ({
        url: "/student/test-records",
        params: { studentId },
      }),
      transformResponse: (res: any) => res?.data || [],
      providesTags: ["Results"],
    }),

    /* ================= HOMEWORK ================= */

    getStudentHomeworkList: builder.query<
      any,
      { page?: number; limit?: number }
    >({
      query: ({ page = 1, limit = 10 }) => ({
        url: "/homework/student",
        params: { page, limit },
      }),
      transformResponse: (res: any) => res?.data || [],
      providesTags: ["Homework"],
    }),

    /* ================= ATTENDANCE ================= */

    markStudentAttendance: builder.mutation({
      query: (body) => ({
        url: "/attendance",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Attendance"],
    }),

    getTodayAttendance: builder.query<any[], { studentId: string }>({
      query: ({ studentId }) => ({
        url: "/attendance/student/today",
        params: { studentId },
      }),
      transformResponse: (res: any) => res?.data || [],
      providesTags: ["Attendance"],
    }),

    getAttendanceSummary: builder.query<any, { studentId: string }>({
      query: ({ studentId }) => ({
        url: "/attendance/student/summary",
        params: { studentId },
      }),
      transformResponse: (res: any) => res?.data || {},
      providesTags: ["Attendance"],
    }),

    getAttendanceHistory: builder.query<
      { data: any[]; meta: { page: number; limit: number; total: number; totalPages: number } },
      { studentId: string; page?: number; limit?: number }
    >({
      query: ({ studentId, page = 1, limit = 10 }) => ({
        url: "/attendance/student",
        params: { studentId, page, limit }, // ✅ FIXED (missing tha)
      }),
      transformResponse: (res: any) => ({
        data: res?.data || [],
        meta: res?.meta || { page: 1, limit: 10, total: 0, totalPages: 0 },
      }),
      providesTags: ["Attendance"],
    }),

    /* ================= DASHBOARD ================= */

    getDashboard: builder.query<DashboardData, { studentId: string }>({
      query: ({ studentId }) => ({
        url: "/student/dashboard",
        params: { studentId },
      }),
      transformResponse: (res: any) => res?.data || ({} as DashboardData),
      providesTags: ["Dashboard"],
    }),
    updateStudentProfile: builder.mutation<any, { studentId: string; formData: FormData }>({
      query: ({ studentId, formData }) => ({
        url: `/school-admin/students/${studentId}`,
        method: "PUT",
        body: formData,
      }),
      invalidatesTags: ["Students"],
    }),
    getMyFees: builder.query<any[], void>({
      query: () => "/student/fees",

      transformResponse: (res: any) => res.data,

      providesTags: ["Fees"],
    }),
    getMyAdmitCards: builder.query<any[], { studentId?: string } | void>({
      query: (args) => {
        const studentId =
          args && typeof args === "object" && "studentId" in args
            ? args.studentId
            : undefined;

        return {
          url: "/student/admit-cards",
          params: studentId ? { studentId } : undefined,
        };
      },
      transformResponse: (res: any) => res.data || [],
      providesTags: ["AdmitCards"],
    }),
  }),
});

/* ================= HOOKS ================= */

export const {
  useGetTodayTimetableQuery,
  useGetWeeklyTimetableQuery,
  useGetStudentExamsQuery,
  useGetMyMarksQuery,
  useGetClassTestRecordsQuery,
  useGetStudentHomeworkListQuery,
  useMarkStudentAttendanceMutation,
  useGetTodayAttendanceQuery,
  useGetAttendanceSummaryQuery,
  useGetAttendanceHistoryQuery,
  useGetDashboardQuery,
  useGetMyFeesQuery,
  useGetMyAdmitCardsQuery,
  useUpdateStudentProfileMutation,
} = studentApi;
