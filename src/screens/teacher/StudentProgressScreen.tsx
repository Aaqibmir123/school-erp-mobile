import { MaterialIcons } from "@expo/vector-icons";
import { useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { useGetSchoolProfileQuery, useGetStudentProgressQuery } from "../../api/teacher/teacherApi";
import BrandLoader from "@/src/components/BrandLoader";
import FallbackBanner from "@/src/components/FallbackBanner";
import RecommendationPanel from "@/src/components/RecommendationPanel";
import { buildRecommendations } from "@/src/utils/recommendations";

export default function StudentProgressScreen({ route }: any) {
  const { classId, subjectId, sectionId } = route.params;

  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { data: schoolProfile } = useGetSchoolProfileQuery();

  /* ================= RTK QUERY ================= */
  const {
    data: response,
    isLoading,
    isFetching,
  } = useGetStudentProgressQuery({
    classId,
    subjectId,
    sectionId,
    page,
    limit: 10,
  });

  const data = response?.data || [];
  const meta = response?.meta || {};

  /* ================= LOAD MORE ================= */
  const loadMore = () => {
    if (!isFetching && meta?.page < meta?.totalPages) {
      setPage((prev) => prev + 1);
    }
  };

  /* ================= HELPERS ================= */

  const getColor = (status: string) => {
    switch (status) {
      case "excellent":
        return "#52c41a";
      case "average":
        return "#faad14";
      case "weak":
        return "#ff4d4f";
      case "irregular":
        return "#1677ff";
      case "careless":
        return "#722ed1";
      default:
        return "#999";
    }
  };

  const getIcon = (status: string) => {
    switch (status) {
      case "excellent":
        return "check-circle";
      case "average":
        return "error-outline";
      case "weak":
        return "cancel";
      case "irregular":
        return "schedule";
      case "careless":
        return "report-problem";
      default:
        return "help";
    }
  };

  /* ================= LOADING ================= */
  if (isLoading) {
    return (
      <View style={styles.center}>
        <BrandLoader />
      </View>
    );
  }

  /* ================= EMPTY ================= */
  if (!data.length) {
    return (
      <View style={styles.center}>
        <FallbackBanner
          title="No student data found"
          subtitle="Progress will appear once the class has recent activity."
        />
      </View>
    );
  }

  /* ================= UI ================= */
  return (
    <View style={styles.container}>
      <Text style={styles.title}>📊 Class Performance</Text>

      <FlatList
        data={data}
        keyExtractor={(item) => item.studentId}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        showsVerticalScrollIndicator={false}
        ListFooterComponent={isFetching ? <BrandLoader compact /> : null}
        renderItem={({ item }) => {
          const isOpen = selectedId === item.studentId;

          const name = item?.name || "Unknown";
          const status = item?.status || "no_data";
          const attendance = item?.attendancePercentage ?? 0;

          return (
            <View style={styles.card}>
              <Text style={styles.name}>{name}</Text>

              <View style={styles.row}>
                <MaterialIcons
                  name={getIcon(status)}
                  size={18}
                  color={getColor(status)}
                />
                <Text style={[styles.status, { color: getColor(status) }]}>
                  {status.toUpperCase()}
                </Text>
              </View>

              <Text style={styles.attendance}>Attendance: {attendance}%</Text>

              <View style={styles.progressBg}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${attendance}%`,
                      backgroundColor: getColor(status),
                    },
                  ]}
                />
              </View>

              <TouchableOpacity
                onPress={() => setSelectedId(isOpen ? null : item.studentId)}
              >
                <Text style={styles.link}>
                  {isOpen ? "Hide Details" : "View Details"}
                </Text>
              </TouchableOpacity>

              {isOpen && (
                <View style={styles.details}>
                  <Text>
                    Homework: {item?.homework?.submitted ?? 0}/
                    {item?.homework?.total ?? 0}
                  </Text>
                  <View style={styles.recommendationWrap}>
                    <RecommendationPanel
                      audience="teacher"
                      title="Teacher actions"
                      subtitle="Use these suggestions to plan extra support and parent follow-up."
                      items={buildRecommendations(
                        "teacher",
                        {
                          attendancePercent: item?.attendancePercentage ?? null,
                          averageMarks: item?.averageMarks ?? item?.marks ?? null,
                          className: item?.className ?? null,
                          homeworkPending:
                            Math.max(
                              (item?.homework?.total ?? 0) -
                                (item?.homework?.submitted ?? 0),
                              0,
                            ) || null,
                          sectionName: item?.sectionName ?? null,
                          studentName: name,
                          subjects: Array.isArray(item?.weakSubjects)
                            ? item.weakSubjects
                            : [],
                          trend:
                            item?.status === "weak" || item?.status === "careless"
                              ? "declining"
                              : "stable",
                          upcomingExams: item?.upcomingExams ?? null,
                        },
                        (schoolProfile as any)?.recommendationConfig,
                      )}
                    />
                  </View>
                </View>
              )}
            </View>
          );
        }}
      />
    </View>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 15,
    backgroundColor: "#f5f7fb",
  },

  title: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 10,
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  card: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 12,
    marginTop: 12,
    elevation: 3,
  },

  name: {
    fontSize: 16,
    fontWeight: "600",
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
  },

  status: {
    marginLeft: 6,
    fontWeight: "600",
  },

  attendance: {
    marginTop: 6,
    color: "#555",
  },

  progressBg: {
    height: 6,
    backgroundColor: "#eee",
    borderRadius: 10,
    marginTop: 8,
  },

  progressFill: {
    height: "100%",
    borderRadius: 10,
  },

  link: {
    color: "#1677ff",
    marginTop: 8,
  },

  details: {
    marginTop: 10,
  },
  recommendationWrap: {
    marginTop: 12,
  },
});
