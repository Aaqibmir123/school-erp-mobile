import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { memo } from "react";
import { StyleSheet, Text, View } from "react-native";

import {
  RecommendationAudience,
  RecommendationItem,
  RecommendationSeverity,
} from "@/src/utils/recommendations";
import { COLORS, RADIUS, SHADOWS, SPACING, TYPOGRAPHY } from "@/src/theme";

const severityStyles: Record<
  RecommendationSeverity,
  { backgroundColor: string; color: string }
> = {
  high: { backgroundColor: "rgba(239,68,68,0.12)", color: COLORS.danger },
  medium: { backgroundColor: "rgba(245,158,11,0.12)", color: COLORS.warning },
  low: { backgroundColor: "rgba(34,197,94,0.10)", color: COLORS.success },
};

const audienceLabel: Record<RecommendationAudience, string> = {
  parent: "Parent guidance",
  student: "Student guidance",
  teacher: "Teacher action",
};

type Props = {
  audience: RecommendationAudience;
  items: RecommendationItem[];
  subtitle?: string;
  title?: string;
};

function RecommendationPanel({
  audience,
  items,
  subtitle,
  title,
}: Props) {
  return (
    <View style={styles.card}>
      <LinearGradient
        colors={["#F8FBFF", "#EEF4FF"]}
        style={styles.header}
      >
        <View style={styles.headerCopy}>
          <View style={styles.badge}>
            <Ionicons name="bulb-outline" size={14} color={COLORS.primary} />
            <Text style={styles.badgeText}>{audienceLabel[audience]}</Text>
          </View>
          <Text style={styles.title}>{title || "Recommendations"}</Text>
          <Text style={styles.subtitle}>
            {subtitle ||
              "Timely, relevant suggestions based on school rules and live student data."}
          </Text>
        </View>
      </LinearGradient>

      <View style={styles.list}>
        {items.map((item) => {
          const tone = severityStyles[item.priority];
          return (
            <View key={item.id} style={styles.item}>
              <View style={styles.itemTop}>
                <View style={[styles.iconWrap, tone]}>
                  <Ionicons name={item.icon as any} size={16} color={tone.color} />
                </View>
                <View style={styles.textWrap}>
                  <View style={styles.row}>
                    <Text style={styles.itemTitle}>{item.title}</Text>
                    <View style={[styles.priorityPill, tone]}>
                      <Text style={[styles.priorityText, { color: tone.color }]}>
                        {item.priority}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.itemDetail}>{item.detail}</Text>
                </View>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

export default memo(RecommendationPanel);

const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.full,
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
  },
  badgeText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: "800",
  },
  card: {
    ...SHADOWS.soft,
    backgroundColor: COLORS.card,
    borderColor: COLORS.border,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    overflow: "hidden",
  },
  header: {
    padding: SPACING.lg,
  },
  headerCopy: {
    gap: 8,
  },
  iconWrap: {
    alignItems: "center",
    borderRadius: RADIUS.full,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  item: {
    backgroundColor: "#fff",
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.md,
  },
  itemDetail: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  itemTitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.textPrimary,
    flex: 1,
    fontWeight: "800",
  },
  itemTop: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: SPACING.sm,
  },
  list: {
    gap: SPACING.sm,
    padding: SPACING.md,
  },
  priorityPill: {
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
  },
  priorityText: {
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  row: {
    alignItems: "center",
    flexDirection: "row",
    gap: SPACING.sm,
  },
  subtitle: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
  textWrap: {
    flex: 1,
  },
  title: {
    ...TYPOGRAPHY.sectionTitle,
    color: COLORS.textPrimary,
  },
});
