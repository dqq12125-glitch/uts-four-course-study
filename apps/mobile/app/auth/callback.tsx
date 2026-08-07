import { useEffect, useRef, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSession } from "@/src/auth/session-context";
import { useCopy } from "@/src/i18n";
import {
  ActionButton,
  InlineNotice,
  LoadingState,
  PageHeading,
  Screen,
} from "@/src/ui/components";

export default function AuthCallbackScreen() {
  const params = useLocalSearchParams<{ token?: string | string[] }>();
  const router = useRouter();
  const { api, acceptMobileSession } = useSession();
  const { t } = useCopy();
  const started = useRef(false);
  const token =
    typeof params.token === "string" ? params.token : params.token?.[0];
  const [error, setError] = useState("");
  const displayedError =
    error ||
    (!token
      ? t(
          "登录链接缺少一次性 Token。",
          "The sign-in link is missing its one-time token.",
        )
      : "");

  useEffect(() => {
    if (!token || started.current) return;
    started.current = true;
    void (async () => {
      try {
        const result = await api.exchangeMagicToken(token);
        await acceptMobileSession(result.sessionToken, result.user);
        router.replace(
          result.user.onboardingCompleted
            ? "/(tabs)/today"
            : "/onboarding",
        );
      } catch (caught) {
        setError(
          caught instanceof Error
            ? caught.message
            : t(
                "这个登录链接无效或已经过期。",
                "This sign-in link is invalid or has expired.",
              ),
        );
      }
    })();
  }, [acceptMobileSession, api, router, t, token]);

  return (
    <Screen scroll={false}>
      {displayedError ? (
        <>
          <PageHeading
            eyebrow="Secure sign-in"
            title={t("无法完成登录", "Could not sign in")}
          />
          <InlineNotice
            tone="danger"
            title={t("登录链接无效", "Invalid sign-in link")}
            body={displayedError}
          />
          <ActionButton
            label={t("重新获取登录链接", "Request another sign-in link")}
            onPress={() => router.replace("/sign-in")}
          />
        </>
      ) : (
        <LoadingState
          label={t(
            "正在交换一次性登录凭证…",
            "Exchanging the one-time sign-in credential…",
          )}
        />
      )}
    </Screen>
  );
}
