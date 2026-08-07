import type { ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  type TextInputProps,
  View,
  type ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppTheme } from "./theme";

export function Screen({
  children,
  scroll = true,
  contentStyle,
}: {
  children: ReactNode;
  scroll?: boolean;
  contentStyle?: ViewStyle;
}) {
  const theme = useAppTheme();
  const content = (
    <View style={[styles.content, contentStyle]}>{children}</View>
  );
  return (
    <SafeAreaView
      edges={["left", "right"]}
      style={[styles.safe, { backgroundColor: theme.canvas }]}
    >
      {scroll ? (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {content}
        </ScrollView>
      ) : (
        content
      )}
    </SafeAreaView>
  );
}

export function PageHeading({
  eyebrow,
  title,
  lead,
}: {
  eyebrow: string;
  title: string;
  lead?: string;
}) {
  const theme = useAppTheme();
  return (
    <View style={styles.heading}>
      <Text style={[styles.eyebrow, { color: theme.accent }]}>{eyebrow}</Text>
      <Text style={[styles.title, { color: theme.ink }]}>{title}</Text>
      {lead ? (
        <Text style={[styles.lead, { color: theme.muted }]}>{lead}</Text>
      ) : null}
    </View>
  );
}

export function Surface({
  children,
  style,
  accessibilityLabel,
}: {
  children: ReactNode;
  style?: ViewStyle;
  accessibilityLabel?: string;
}) {
  const theme = useAppTheme();
  return (
    <View
      accessibilityLabel={accessibilityLabel}
      style={[
        styles.surface,
        {
          backgroundColor: theme.surface,
          borderColor: theme.line,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function ActionButton({
  label,
  onPress,
  disabled = false,
  variant = "primary",
  accessibilityHint,
}: {
  label: string;
  onPress(): void;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "danger";
  accessibilityHint?: string;
}) {
  const theme = useAppTheme();
  const background =
    variant === "primary"
      ? theme.accent
      : variant === "danger"
        ? theme.danger
        : theme.surfaceMuted;
  const color =
    variant === "primary" || variant === "danger"
      ? theme.inverted
      : theme.ink;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityHint={accessibilityHint}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: pressed ? theme.accentPressed : background,
          borderColor:
            variant === "secondary" ? theme.line : background,
          opacity: disabled ? 0.5 : 1,
        },
      ]}
    >
      <Text style={[styles.buttonLabel, { color }]}>{label}</Text>
    </Pressable>
  );
}

export function Field({
  label,
  ...props
}: TextInputProps & { label: string }) {
  const theme = useAppTheme();
  return (
    <View style={styles.field}>
      <Text style={[styles.fieldLabel, { color: theme.ink }]}>{label}</Text>
      <TextInput
        {...props}
        placeholderTextColor={theme.muted}
        selectionColor={theme.accent}
        style={[
          styles.input,
          {
            backgroundColor: theme.surface,
            borderColor: theme.line,
            color: theme.ink,
          },
          props.multiline ? styles.multiline : null,
          props.style,
        ]}
      />
    </View>
  );
}

export function InlineNotice({
  title,
  body,
  tone = "neutral",
}: {
  title: string;
  body: string;
  tone?: "neutral" | "warning" | "danger";
}) {
  const theme = useAppTheme();
  const background =
    tone === "warning"
      ? theme.warningSurface
      : tone === "danger"
        ? theme.dangerSurface
        : theme.surfaceMuted;
  const line =
    tone === "warning"
      ? theme.amber
      : tone === "danger"
        ? theme.danger
        : theme.accent;
  return (
    <View style={[styles.notice, { backgroundColor: background, borderColor: line }]}>
      <Text style={[styles.noticeTitle, { color: theme.ink }]}>{title}</Text>
      <Text style={[styles.noticeBody, { color: theme.muted }]}>{body}</Text>
    </View>
  );
}

export function LoadingState({ label = "正在加载…" }: { label?: string }) {
  const theme = useAppTheme();
  return (
    <View style={styles.center}>
      <ActivityIndicator color={theme.accent} />
      <Text style={[styles.centerText, { color: theme.muted }]}>{label}</Text>
    </View>
  );
}

export function EmptyState({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  const theme = useAppTheme();
  return (
    <View style={styles.center}>
      <Text style={[styles.emptyTitle, { color: theme.ink }]}>{title}</Text>
      <Text style={[styles.centerText, { color: theme.muted }]}>{body}</Text>
    </View>
  );
}

export function Stat({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  const theme = useAppTheme();
  return (
    <View style={styles.stat}>
      <Text style={[styles.statLabel, { color: theme.muted }]}>{label}</Text>
      <Text style={[styles.statValue, { color: theme.ink }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    width: "100%",
    maxWidth: 720,
    alignSelf: "center",
    gap: 16,
    paddingHorizontal: 18,
    paddingTop: 20,
    paddingBottom: 112,
  },
  heading: {
    gap: 7,
    paddingVertical: 4,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  title: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: "800",
    letterSpacing: -0.7,
  },
  lead: {
    fontSize: 16,
    lineHeight: 24,
  },
  surface: {
    gap: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 16,
    padding: 16,
  },
  button: {
    minHeight: 50,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: "800",
  },
  field: {
    gap: 7,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: "700",
  },
  input: {
    minHeight: 50,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 16,
  },
  multiline: {
    minHeight: 96,
    textAlignVertical: "top",
  },
  notice: {
    gap: 4,
    borderLeftWidth: 4,
    borderRadius: 10,
    padding: 13,
  },
  noticeTitle: {
    fontSize: 15,
    fontWeight: "800",
  },
  noticeBody: {
    fontSize: 14,
    lineHeight: 20,
  },
  center: {
    minHeight: 220,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingHorizontal: 28,
  },
  centerText: {
    textAlign: "center",
    fontSize: 15,
    lineHeight: 22,
  },
  emptyTitle: {
    textAlign: "center",
    fontSize: 20,
    fontWeight: "800",
  },
  stat: {
    flex: 1,
    minWidth: 92,
    gap: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: "700",
  },
  statValue: {
    fontSize: 19,
    fontWeight: "800",
  },
});
