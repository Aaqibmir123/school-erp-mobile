import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useCallback, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import {
  useGetAttendanceSummaryQuery,
  useGetMyFeesQuery,
  useGetMyMarksQuery,
  useUpdateStudentProfileMutation,
} from "@/src/api/student/student.api";
import { useGetSchoolProfileQuery } from "@/src/api/teacher/teacherApi";
import FallbackBanner from "@/src/components/FallbackBanner";
import RecommendationPanel from "@/src/components/RecommendationPanel";
import { APP_ENV } from "@/src/config/env";
import { useAuth } from "@/src/context/AuthContext";
import { COLORS, RADIUS, SHADOWS, SPACING, TYPOGRAPHY } from "@/src/theme";
import { showToast } from "@/src/utils/toast";
import { buildRecommendations, type RecommendationAudience } from "@/src/utils/recommendations";
import { STUDENT_GLAS_CARD, STUDENT_THEME } from "../studentTheme";

const MAX_UPLOAD_SIZE = 5 * 1024 * 1024;

const resolveUploadError = (error: any) => {
  const message = String(
    error?.data?.message || error?.message || error?.statusText || "",
  ).trim();

  if (/limit_file_size|file too large|payload too large/i.test(message)) {
    return "Image is too large. Please choose a file under 5 MB.";
  }

  if (/network|failed to fetch/i.test(message)) {
    return "Network issue while uploading. Please try again.";
  }

  if (/invalid|unsupported|mime/i.test(message)) {
    return "Unsupported image format. Please choose a JPG or PNG file.";
  }

  if (message) {
    return `Upload failed: ${message}`;
  }

  return "Upload failed. Please try again.";
};

const ProfileItem = ({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) => (
  <View style={styles.infoRow}>
    <View style={styles.infoIconWrap}>
      <Ionicons name={icon} size={18} color={COLORS.primary} />
    </View>
    <View style={styles.infoTextWrap}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  </View>
);

export default function ProfileScreen() {
  const { role, selectedStudent, setSelectedStudent } = useAuth();
  const [updateProfile, { isLoading }] = useUpdateStudentProfileMutation();
  const [localImage, setLocalImage] = useState<string | null>(null);
  const { data: schoolProfile } = useGetSchoolProfileQuery();
  const { data: attendanceSummary } = useGetAttendanceSummaryQuery(
    { studentId: selectedStudent?._id! },
    { skip: !selectedStudent?._id },
  );
  const { data: marksCard } = useGetMyMarksQuery(
    { studentId: selectedStudent?._id! },
    { skip: !selectedStudent?._id },
  );
  const { data: feeItems = [] } = useGetMyFeesQuery(undefined, {
    skip: !selectedStudent?._id,
  });

  const studentName = useMemo(() => {
    if (!selectedStudent) return "";
    return `${selectedStudent.firstName || ""} ${
      selectedStudent.lastName || ""
    }`.trim();
  }, [selectedStudent]);

  const initials = useMemo(() => {
    if (!selectedStudent) return "S";
    return `${selectedStudent.firstName?.charAt(0) || "S"}${
      selectedStudent.lastName?.charAt(0) || ""
    }`;
  }, [selectedStudent]);

  const resolveImageUri = (value?: string | null) => {
    if (!value) return null;
    if (/^https?:\/\//i.test(value) || value.startsWith("file:")) return value;
    return `${APP_ENV.SERVER_URL}${value}`;
  };

  const currentImage = resolveImageUri(
    localImage || selectedStudent?.profileImage || null,
  );
  const averageMarks = Number((marksCard as any)?.summary?.percentage || 0);

  const recommendationAudience: RecommendationAudience =
    String(role || "").toUpperCase() === "PARENT" ? "parent" : "student";

  const recommendationItems = useMemo(() => {
    const summary = (marksCard as any)?.summary || {};
    const subjects = Array.isArray((marksCard as any)?.subjects)
      ? (marksCard as any).subjects
      : [];
    const weakSubjects = subjects
      .filter((subject: any) => {
        if (typeof subject?.obtained !== "number" || typeof subject?.max !== "number") {
          return false;
        }

        const percentage = (subject.obtained / Math.max(subject.max, 1)) * 100;
        return percentage < 60;
      })
      .map((subject: any) => subject?.name)
      .filter(Boolean)
      .slice(0, 3);

    const feePending = feeItems.filter((item: any) => Number(item?.remainingAmount || 0) > 0).length;
    const attendancePercent = Number(
      attendanceSummary?.percentage ||
        attendanceSummary?.data?.percentage ||
        summary?.attendancePercentage ||
        0,
    );
    return buildRecommendations(
      recommendationAudience,
      {
        attendancePercent: attendancePercent || null,
        averageMarks: averageMarks || null,
        className: selectedStudent?.classId?.name || null,
        feePending,
        homeworkPending: Number(
          (attendanceSummary as any)?.homeworkPending ||
            (attendanceSummary as any)?.stats?.activeHomeworkCount ||
            0,
        ),
        sectionName: selectedStudent?.sectionId?.name || null,
        studentName,
        subjects: weakSubjects,
        trend:
          attendancePercent > 0 && averageMarks > 0 && attendancePercent < 80 && averageMarks < 65
            ? "declining"
            : "stable",
        upcomingExams: Number((attendanceSummary as any)?.upcomingExams || 0),
      },
      (schoolProfile as any)?.recommendationConfig,
    );
  }, [
    attendanceSummary,
    averageMarks,
    feeItems,
    marksCard,
    recommendationAudience,
    schoolProfile,
    selectedStudent?.classId?.name,
    selectedStudent?.sectionId?.name,
    studentName,
  ]);

  const uploadPhoto = useCallback(async () => {
    if (!selectedStudent?._id) return;

    const result = await DocumentPicker.getDocumentAsync({
      type: ["image/*"],
      copyToCacheDirectory: true,
      multiple: false,
    });

    if (result.canceled || !result.assets?.length) return;

    const asset = result.assets[0];
    const mimeType = asset.mimeType || "image/jpeg";
    const fileName = asset.name || `student-${selectedStudent._id}.jpg`;

    if (typeof asset.size === "number" && asset.size > MAX_UPLOAD_SIZE) {
      showToast.error("Image is too large. Please choose a file under 5 MB.");
      return;
    }

    const formData = new FormData();
    formData.append("profileImage", {
      uri: asset.uri,
      type: mimeType,
      name: fileName,
    } as any);

    try {
      const response = await updateProfile({
        studentId: selectedStudent._id,
        formData,
      }).unwrap();

      const updatedStudent = response?.data || response;
      if (updatedStudent) {
        setSelectedStudent({
          ...selectedStudent,
          ...updatedStudent,
        });

        setLocalImage(updatedStudent.profileImage || asset.uri);
      } else {
        setLocalImage(asset.uri);
      }

      showToast.success("Profile photo updated");
    } catch (error: any) {
      showToast.error(resolveUploadError(error));
    }
  }, [selectedStudent, setSelectedStudent, updateProfile]);

  if (!selectedStudent) {
    return (
      <View style={styles.center}>
        <FallbackBanner
          title="No student profile"
          subtitle="Please pick a linked child from the drawer."
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={STUDENT_THEME.heroGradient} style={styles.heroBg} />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <Pressable onPress={uploadPhoto} style={styles.avatarWrap}>
            {currentImage ? (
              <Image
                source={{ uri: currentImage }}
                style={styles.avatarImage}
                contentFit="cover"
              />
            ) : (
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarText}>{initials}</Text>
              </View>
            )}

            <View style={styles.cameraBadge}>
              <Ionicons name="camera" size={14} color="#fff" />
            </View>
          </Pressable>

          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeText}>Student profile</Text>
          </View>

          <Text style={styles.name}>{studentName || "Student Profile"}</Text>
          <Text style={styles.meta}>
            {selectedStudent.classId?.name || "Class not set"}
            {selectedStudent.sectionId?.name
              ? ` - ${selectedStudent.sectionId.name}`
              : ""}
          </Text>

          <Pressable
            onPress={uploadPhoto}
            style={({ pressed }) => [
              styles.uploadBtn,
              pressed && styles.uploadBtnPressed,
            ]}
            disabled={isLoading}
          >
            <Ionicons
              name="cloud-upload-outline"
              size={18}
              color={COLORS.primary}
            />
            <Text style={styles.uploadText}>
              {isLoading ? "Uploading..." : currentImage ? "Change photo" : "Upload photo"}
            </Text>
          </Pressable>

          <Text style={styles.uploadHint}>
            JPG or PNG, up to 5 MB
          </Text>
        </View>

        <View style={styles.card}>
          <View style={styles.recommendationWrap}>
            <RecommendationPanel
              audience={recommendationAudience}
              title="Student guidance"
              subtitle="Actionable advice is generated from attendance, marks, fees, and school rules."
              items={recommendationItems}
            />
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Profile Details</Text>
            <Text style={styles.sectionHint}>Linked account</Text>
          </View>

          <ProfileItem
            icon="person-outline"
            label="Student Name"
            value={studentName || "N/A"}
          />
          <ProfileItem
            icon="school-outline"
            label="Class"
            value={selectedStudent.classId?.name || "N/A"}
          />
          <ProfileItem
            icon="albums-outline"
            label="Section"
            value={selectedStudent.sectionId?.name || "All"}
          />
          <ProfileItem
            icon="calendar-outline"
            label="Admission Year"
            value="Available in school records"
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: "center",
    backgroundColor: COLORS.background,
    flex: 1,
    justifyContent: "center",
    padding: SPACING.lg,
  },
  container: {
    backgroundColor: COLORS.background,
    flex: 1,
  },
  content: {
    paddingBottom: SPACING.xxl,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
  },
  hero: {
    alignItems: "center",
    backgroundColor: "rgba(15, 23, 42, 0.38)",
    borderColor: "rgba(255, 255, 255, 0.18)",
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    marginBottom: SPACING.lg,
    padding: SPACING.xl,
    ...SHADOWS.card,
  },
  heroBg: {
    height: 260,
    position: "absolute",
    width: "100%",
  },
  heroBadge: {
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: RADIUS.full,
    marginBottom: SPACING.sm,
    marginTop: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
  },
  heroBadgeText: {
    color: COLORS.textInverse,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  avatarWrap: {
    alignItems: "center",
    height: 110,
    justifyContent: "center",
    width: 110,
  },
  avatarCircle: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.18)",
    borderColor: "rgba(255,255,255,0.28)",
    borderRadius: 999,
    borderWidth: 1,
    height: 92,
    justifyContent: "center",
    width: 92,
  },
  avatarImage: {
    borderColor: "rgba(255,255,255,0.24)",
    borderRadius: 999,
    borderWidth: 1,
    height: 92,
    width: 92,
  },
  avatarText: {
    ...TYPOGRAPHY.title,
    color: COLORS.textInverse,
    fontSize: 28,
  },
  cameraBadge: {
    alignItems: "center",
    backgroundColor: COLORS.primary,
    borderColor: "rgba(255,255,255,0.6)",
    borderRadius: 999,
    borderWidth: 2,
    bottom: 8,
    height: 28,
    justifyContent: "center",
    position: "absolute",
    right: 8,
    width: 28,
  },
  name: {
    ...TYPOGRAPHY.headline,
    color: COLORS.textInverse,
    textAlign: "center",
  },
  meta: {
    ...TYPOGRAPHY.body,
    color: "rgba(255,255,255,0.88)",
    marginTop: SPACING.xs,
    textAlign: "center",
  },
  uploadBtn: {
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderColor: COLORS.border,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    flexDirection: "row",
    gap: SPACING.sm,
    justifyContent: "center",
    marginTop: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    paddingVertical: 12,
  },
  uploadBtnPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  uploadText: {
    color: COLORS.primary,
    fontWeight: "800",
  },
  uploadHint: {
    color: "rgba(255,255,255,0.82)",
    fontSize: 12,
    marginTop: SPACING.sm,
    textAlign: "center",
  },
  card: {
    ...SHADOWS.soft,
    backgroundColor: STUDENT_GLAS_CARD.backgroundColor,
    borderColor: STUDENT_GLAS_CARD.borderColor,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    marginBottom: SPACING.lg,
    padding: SPACING.lg,
  },
  recommendationWrap: {
    marginBottom: SPACING.lg,
  },
  sectionHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    ...TYPOGRAPHY.sectionTitle,
    color: COLORS.textPrimary,
  },
  sectionHint: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textTertiary,
    fontWeight: "700",
  },
  infoRow: {
    flexDirection: "row",
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  infoIconWrap: {
    alignItems: "center",
    backgroundColor: COLORS.primaryLight,
    borderRadius: 14,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  infoTextWrap: {
    flex: 1,
  },
  infoLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  infoValue: {
    ...TYPOGRAPHY.body,
    color: COLORS.textPrimary,
    fontWeight: "700",
  },
});
