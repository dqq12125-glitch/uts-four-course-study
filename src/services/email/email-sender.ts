export interface MagicLinkEmail {
  to: string;
  verifyUrl: string;
  expiresInMinutes: number;
  language: "zh-CN" | "en";
}

export interface EmailDelivery {
  previewUrl?: string;
  providerMessageId?: string;
}

export interface NotificationEmail {
  to: string;
  subject: string;
  body: string;
  actionUrl: string;
  settingsUrl: string;
  unsubscribeUrl: string;
  language: "zh-CN" | "en";
}

export interface EmailSender {
  sendMagicLink(message: MagicLinkEmail): Promise<EmailDelivery>;
  sendNotification(message: NotificationEmail): Promise<EmailDelivery>;
}

export class DevelopmentEmailSender implements EmailSender {
  async sendMagicLink(message: MagicLinkEmail): Promise<EmailDelivery> {
    return { previewUrl: message.verifyUrl };
  }

  async sendNotification(
    _message: NotificationEmail,
  ): Promise<EmailDelivery> {
    void _message;
    return { providerMessageId: "development-noop" };
  }
}
