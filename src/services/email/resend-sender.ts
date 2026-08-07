import { ApiError } from "../../lib/api-errors.ts";
import type {
  EmailDelivery,
  EmailSender,
  MagicLinkEmail,
  NotificationEmail,
} from "./email-sender.ts";

export class ResendEmailSender implements EmailSender {
  private readonly apiKey: string;
  private readonly from: string;

  constructor(
    apiKey: string,
    from: string,
  ) {
    this.apiKey = apiKey;
    this.from = from;
  }

  async sendMagicLink(message: MagicLinkEmail): Promise<EmailDelivery> {
    const isChinese = message.language === "zh-CN";
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: this.from,
        to: [message.to],
        subject: isChinese
          ? "登录 DeepStudy"
          : "Sign in to DeepStudy",
        html: `
          <p>${isChinese ? "点击下方链接登录 DeepStudy。" : "Use the link below to sign in to DeepStudy."}</p>
          <p><a href="${escapeHtml(message.verifyUrl)}">${isChinese ? "安全登录" : "Sign in securely"}</a></p>
          <p>${isChinese ? `链接将在 ${message.expiresInMinutes} 分钟后失效。` : `This link expires in ${message.expiresInMinutes} minutes.`}</p>
        `,
      }),
    });

    if (!response.ok) {
      throw new ApiError(
        "EMAIL_DELIVERY_FAILED",
        503,
        "We could not send the sign-in email. Please try again.",
      );
    }
    const payload = (await response.json().catch(() => null)) as
      | { id?: string }
      | null;
    return { providerMessageId: payload?.id };
  }

  async sendNotification(
    message: NotificationEmail,
  ): Promise<EmailDelivery> {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: this.from,
        to: [message.to],
        subject: message.subject,
        html: `
          <p>${escapeHtml(message.body)}</p>
          <p><a href="${escapeHtml(message.actionUrl)}">${message.language === "zh-CN" ? "打开 DeepStudy" : "Open DeepStudy"}</a></p>
          <p style="color:#647168;font-size:12px">
            <a href="${escapeHtml(message.settingsUrl)}">${message.language === "zh-CN" ? "管理提醒设置" : "Manage reminder settings"}</a>
            ·
            <a href="${escapeHtml(message.unsubscribeUrl)}">${message.language === "zh-CN" ? "退订邮件提醒" : "Unsubscribe from reminder emails"}</a>
          </p>
        `,
        headers: {
          "List-Unsubscribe": `<${message.unsubscribeUrl}>`,
          "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
        },
      }),
    });
    if (!response.ok) {
      throw new ApiError(
        "EMAIL_DELIVERY_FAILED",
        503,
        "The reminder email could not be delivered.",
      );
    }
    const payload = (await response.json().catch(() => null)) as
      | { id?: string }
      | null;
    return { providerMessageId: payload?.id };
  }
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
