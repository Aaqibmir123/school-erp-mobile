export type RecommendationAudience = "teacher" | "student" | "parent";

export type RecommendationSeverity = "high" | "medium" | "low";

export type RecommendationContext = {
  attendancePercent?: number | null;
  averageMarks?: number | null;
  className?: string | null;
  feePending?: number | null;
  homeworkPending?: number | null;
  sectionName?: string | null;
  studentName?: string | null;
  subjects?: string[];
  trend?: "improving" | "stable" | "declining" | null;
  upcomingExams?: number | null;
};

export type RecommendationConfig = {
  enabled: boolean;
  feePendingThreshold: number;
  gradeThreshold: number;
  homeworkPendingThreshold: number;
  lowAttendanceThreshold: number;
  trackAttendance: boolean;
  trackGrades: boolean;
  trackTrends: boolean;
  trackWorkload: boolean;
};

export type RecommendationItem = {
  audience: RecommendationAudience;
  detail: string;
  icon: string;
  id: string;
  priority: RecommendationSeverity;
  title: string;
};

const DEFAULT_CONFIG: RecommendationConfig = {
  enabled: true,
  feePendingThreshold: 1,
  gradeThreshold: 60,
  homeworkPendingThreshold: 1,
  lowAttendanceThreshold: 85,
  trackAttendance: true,
  trackGrades: true,
  trackTrends: true,
  trackWorkload: true,
};

const clampNumber = (
  value: unknown,
  fallback: number,
  min: number,
  max: number,
) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.min(Math.max(numeric, min), max);
};

export const normalizeRecommendationConfig = (
  raw?: Partial<RecommendationConfig> | string | null,
): RecommendationConfig => {
  if (!raw) return DEFAULT_CONFIG;

  const parsed =
    typeof raw === "string"
      ? (() => {
          try {
            return JSON.parse(raw) as Partial<RecommendationConfig>;
          } catch {
            return {};
          }
        })()
      : raw;

  return {
    enabled: parsed.enabled ?? DEFAULT_CONFIG.enabled,
    feePendingThreshold: clampNumber(
      parsed.feePendingThreshold,
      DEFAULT_CONFIG.feePendingThreshold,
      0,
      20,
    ),
    gradeThreshold: clampNumber(
      parsed.gradeThreshold,
      DEFAULT_CONFIG.gradeThreshold,
      0,
      100,
    ),
    homeworkPendingThreshold: clampNumber(
      parsed.homeworkPendingThreshold,
      DEFAULT_CONFIG.homeworkPendingThreshold,
      0,
      20,
    ),
    lowAttendanceThreshold: clampNumber(
      parsed.lowAttendanceThreshold,
      DEFAULT_CONFIG.lowAttendanceThreshold,
      0,
      100,
    ),
    trackAttendance: parsed.trackAttendance ?? DEFAULT_CONFIG.trackAttendance,
    trackGrades: parsed.trackGrades ?? DEFAULT_CONFIG.trackGrades,
    trackTrends: parsed.trackTrends ?? DEFAULT_CONFIG.trackTrends,
    trackWorkload: parsed.trackWorkload ?? DEFAULT_CONFIG.trackWorkload,
  };
};

const formatSubjects = (subjects?: string[]) =>
  Array.isArray(subjects) && subjects.length > 0
    ? subjects.slice(0, 2).join(", ")
    : "";

const createItem = (
  audience: RecommendationAudience,
  id: string,
  title: string,
  detail: string,
  priority: RecommendationSeverity,
  icon: string,
): RecommendationItem => ({
  audience,
  detail,
  icon,
  id,
  priority,
  title,
});

export const buildRecommendations = (
  audience: RecommendationAudience,
  context: RecommendationContext,
  rawConfig?: Partial<RecommendationConfig> | string | null,
): RecommendationItem[] => {
  const config = normalizeRecommendationConfig(rawConfig);

  if (!config.enabled) return [];

  const items: RecommendationItem[] = [];
  const studentLabel = context.studentName?.trim() || "This student";
  const classLabel = [context.className, context.sectionName]
    .filter(Boolean)
    .join(" - ");
  const attendancePercent = context.attendancePercent ?? null;
  const averageMarks = context.averageMarks ?? null;
  const homeworkPending = context.homeworkPending ?? null;
  const feePending = context.feePending ?? null;
  const trend = context.trend ?? null;

  if (config.trackAttendance && typeof attendancePercent === "number") {
    const threshold = config.lowAttendanceThreshold;
    if (attendancePercent < threshold) {
      items.push(
        createItem(
          audience,
          "attendance",
          audience === "teacher"
            ? "Attendance needs follow-up"
            : audience === "parent"
              ? "Support attendance routine"
              : "Improve attendance consistency",
          audience === "teacher"
            ? `${studentLabel} is at ${Math.round(
                attendancePercent,
              )}% attendance. Plan extra support and parent follow-up for ${classLabel || "the class"}.`
            : audience === "parent"
              ? `${studentLabel} is at ${Math.round(
                  attendancePercent,
                )}% attendance. Keep a fixed morning routine and confirm daily attendance.`
              : `You are at ${Math.round(
                  attendancePercent,
                )}% attendance. Aim for regular class attendance to stay on track.`,
          "high",
          "calendar-outline",
        ),
      );
    }
  }

  if (config.trackGrades && typeof averageMarks === "number") {
    const threshold = config.gradeThreshold;
    if (averageMarks < threshold) {
      const subjectHint = formatSubjects(context.subjects);

      items.push(
        createItem(
          audience,
          "grades",
          audience === "teacher"
            ? "Focus on weak topics"
            : audience === "parent"
              ? "Review weak subjects at home"
              : "Spend time on weak topics",
          audience === "teacher"
            ? `${studentLabel} is averaging ${Math.round(
                averageMarks,
              )}%.${subjectHint ? ` Start with ${subjectHint}.` : ""} Extra classes or guided revision will help.`
            : audience === "parent"
              ? `The current average is ${Math.round(
                  averageMarks,
                )}%.${subjectHint ? ` Practice ${subjectHint} with your child.` : ""} A short daily revision routine will help.`
              : `Your average is ${Math.round(
                  averageMarks,
                )}%.${subjectHint ? ` Focus on ${subjectHint}.` : ""} Small daily revision sessions will help.`,
          averageMarks < 50 ? "high" : "medium",
          "book-outline",
        ),
      );
    }
  }

  if (config.trackTrends && trend === "declining") {
    items.push(
      createItem(
        audience,
        "trend",
        audience === "teacher"
          ? "Declining trend detected"
          : audience === "parent"
            ? "Trend is slipping"
            : "Keep the momentum going",
        audience === "teacher"
          ? `Recent performance is trending downward for ${studentLabel}. Intervene early before the next assessment.`
          : audience === "parent"
            ? `${studentLabel}'s recent trend is slipping. Review the current routine and support a calmer study schedule.`
            : `Your recent results are trending down. A steady routine now will help you recover quickly.`,
        "medium",
        "trending-down-outline",
      ),
    );
  }

  if (config.trackWorkload && typeof homeworkPending === "number") {
    if (homeworkPending >= config.homeworkPendingThreshold) {
      items.push(
        createItem(
          audience,
          "homework",
          audience === "teacher"
            ? "Track pending homework"
            : audience === "parent"
              ? "Support homework completion"
              : "Finish pending homework",
          audience === "teacher"
            ? `${studentLabel} has ${homeworkPending} pending homework item${
                homeworkPending === 1 ? "" : "s"
              }. Assign a catch-up plan and review the missed work.`
            : audience === "parent"
              ? `There are ${homeworkPending} pending homework item${
                  homeworkPending === 1 ? "" : "s"
                }. Set a short daily homework window and check completion.`
              : `You still have ${homeworkPending} pending homework item${
                  homeworkPending === 1 ? "" : "s"
                }. Finish them first to stay ahead.`,
          homeworkPending > 2 ? "high" : "low",
          "clipboard-outline",
        ),
      );
    }
  }

  if (
    typeof feePending === "number" &&
    feePending >= config.feePendingThreshold &&
    feePending > 0
  ) {
    items.push(
      createItem(
        audience,
        "fees",
        audience === "teacher"
          ? "Coordinate pending dues"
          : audience === "parent"
            ? "Review pending school dues"
            : "Check school dues",
        audience === "teacher"
          ? `${studentLabel} has ${feePending} pending fee record${
              feePending === 1 ? "" : "s"
            }. Share the reminder with parents and follow up politely.`
          : audience === "parent"
            ? `There are ${feePending} pending fee record${
                feePending === 1 ? "" : "s"
              }. Please review and clear them when possible.`
            : `There are ${feePending} pending fee record${
                feePending === 1 ? "" : "s"
              }. Ask a parent or guardian to review them.`,
        feePending > 1 ? "medium" : "low",
        "cash-outline",
      ),
    );
  }

  if (!items.length) {
    items.push(
      createItem(
        audience,
        "all-clear",
        audience === "teacher"
          ? "No urgent interventions"
          : audience === "parent"
            ? "Keep the current routine"
            : "Stay consistent",
        audience === "teacher"
          ? `${studentLabel} is currently on track. Keep monitoring attendance, marks, and task completion.`
          : audience === "parent"
            ? `${studentLabel} is on track. Keep the routine stable and encourage regular study habits.`
            : "You are on track right now. Keep following the current routine.",
        "low",
        "checkmark-circle-outline",
      ),
    );
  }

  return items.slice(0, 4);
};
