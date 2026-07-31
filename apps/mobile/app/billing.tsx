import { useCallback, useState } from "react";
import * as WebBrowser from "expo-web-browser";
import { useFocusEffect } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import type { BillingOverview } from "@/src/api/types";
import { useSession } from "@/src/auth/session-context";
import { useCopy } from "@/src/i18n";
import {
  ActionButton,
  EmptyState,
  InlineNotice,
  LoadingState,
  PageHeading,
  Screen,
  Surface,
} from "@/src/ui/components";
import { useAppTheme } from "@/src/ui/theme";

export default function BillingScreen() {
  const theme = useAppTheme();
  const { api } = useSession();
  const { t, locale } = useCopy();
  const [overview, setOverview] = useState<BillingOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setOverview(await api.billing());
      setError("");
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : t("无法加载套餐。", "Could not load your plan."),
      );
    } finally {
      setLoading(false);
    }
  }, [api, t]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  async function portal() {
    setBusy(true);
    setError("");
    try {
      const result = await api.createBillingPortal();
      await WebBrowser.openBrowserAsync(result.portalUrl);
      await load();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : t("客户门户不可用。", "The customer portal is unavailable."),
      );
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <Screen scroll={false}>
        <LoadingState
          label={t(
            "正在读取套餐与购买记录…",
            "Loading plan and purchase history…",
          )}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <PageHeading
        eyebrow="Server-owned entitlements"
        title={t("套餐与购买记录", "Plan and purchases")}
        lead={t(
          "权限由服务端购买记录计算，App 不会自行决定价格或解锁功能。",
          "Access is calculated from server-side purchase records. The app never chooses prices or unlocks features itself.",
        )}
      />
      {error ? (
        <InlineNotice
          tone="danger"
          title={t("账单未同步", "Billing not synced")}
          body={error}
        />
      ) : null}
      {overview ? (
        <>
          <Surface>
            <Text style={[styles.plan, { color: theme.accent }]}>
              {overview.entitlement.planKey.replaceAll("_", " ")}
            </Text>
            <Text style={[styles.title, { color: theme.ink }]}>
              {t(
                `当前最多 ${overview.entitlement.courseLimit} 门活跃课程`,
                `Up to ${overview.entitlement.courseLimit} active courses`,
              )}
            </Text>
            <Text style={[styles.body, { color: theme.muted }]}>
              {t(
                `AI 每日 ${overview.entitlement.dailyAiMessageLimit} 条 · 每周生成练习 ${overview.entitlement.weeklyPracticeGenerationLimit} 道`,
                `${overview.entitlement.dailyAiMessageLimit} AI messages per day · ${overview.entitlement.weeklyPracticeGenerationLimit} generated questions per week`,
              )}
            </Text>
            {overview.entitlement.isFoundingUser ? (
              <InlineNotice
                title="Founding user"
                body={t(
                  "你的创始用户标识已由服务端确认。",
                  "Your founding-user status has been confirmed by the server.",
                )}
              />
            ) : null}
          </Surface>
          <InlineNotice
            tone="warning"
            title={t(
              "原生购买尚未启用",
              "Native purchases are not enabled yet",
            )}
            body={t(
              "Web 端 Stripe Checkout 已实现；iOS/Android 数字内容购买需在商店签名与产品配置完成后按平台规则接入。这里不会绕过商店政策。",
              "Stripe Checkout is available on the web. iOS and Android digital purchases require signed store builds and configured store products, and this app does not bypass store policies.",
            )}
          />
          {overview.purchases.length ? (
            overview.purchases.map((purchase) => (
              <Surface key={purchase.id}>
                <View style={styles.row}>
                  <Text style={[styles.title, { color: theme.ink }]}>
                    {purchase.productKey.replaceAll("_", " ")}
                  </Text>
                  <Text style={[styles.status, { color: theme.accent }]}>
                    {purchase.status}
                  </Text>
                </View>
                <Text style={[styles.body, { color: theme.muted }]}>
                  {new Intl.NumberFormat("en-AU", {
                    style: "currency",
                    currency: purchase.currency.toUpperCase(),
                  }).format(purchase.amountMinor / 100)}
                  {purchase.accessEndAt
                    ? t(
                        ` · 权限至 ${new Intl.DateTimeFormat(locale, {
                          dateStyle: "medium",
                        }).format(new Date(purchase.accessEndAt))}`,
                        ` · Access until ${new Intl.DateTimeFormat(locale, {
                        dateStyle: "medium",
                        }).format(new Date(purchase.accessEndAt))}`,
                      )
                    : ""}
                </Text>
              </Surface>
            ))
          ) : (
            <EmptyState
              title={t("没有购买记录", "No purchase history")}
              body={t(
                "你当前使用 Free 权限。",
                "You are currently using the Free plan.",
              )}
            />
          )}
          <ActionButton
            variant="secondary"
            disabled={busy}
            label={
              busy
                ? t("正在打开…", "Opening…")
                : t("管理已有订阅", "Manage subscriptions")
            }
            onPress={() => void portal()}
          />
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  plan: { fontSize: 12, fontWeight: "900", textTransform: "uppercase" },
  title: { fontSize: 18, fontWeight: "800" },
  body: { fontSize: 14, lineHeight: 21 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  status: { fontSize: 13, fontWeight: "800" },
});
