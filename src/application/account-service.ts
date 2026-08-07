import type { AccountRepository } from "../repositories/account-repository.ts";
import type { PrivateObjectStorage } from "../services/storage/private-object-storage.ts";
import { ApiError } from "../lib/api-errors.ts";
import { createId } from "../lib/ids.ts";
import { isValidTimeZone } from "../lib/timezone.ts";

export class AccountService {
  private readonly repository: AccountRepository;
  private readonly storage: PrivateObjectStorage;

  constructor(
    repository: AccountRepository,
    storage: PrivateObjectStorage,
  ) {
    this.repository = repository;
    this.storage = storage;
  }

  async settings(userId: string) {
    const settings = await this.repository.settings(userId);
    if (!settings) {
      throw new ApiError(
        "ACCOUNT_NOT_FOUND",
        404,
        "The account was not found.",
      );
    }
    return settings;
  }

  async updateProfile(input: {
    userId: string;
    displayName: string | null;
    preferredLanguage: "zh-CN" | "en";
    timezone: string;
    now?: Date;
  }): Promise<void> {
    if (!isValidTimeZone(input.timezone)) {
      throw new ApiError(
        "TIMEZONE_INVALID",
        400,
        "Choose a valid IANA time zone.",
      );
    }
    const updated = await this.repository.updateProfile({
      ...input,
      displayName: input.displayName?.trim() || null,
      now: (input.now ?? new Date()).toISOString(),
    });
    if (!updated) {
      throw new ApiError(
        "ACCOUNT_NOT_FOUND",
        404,
        "The account was not found.",
      );
    }
  }

  async exportData(userId: string, now = new Date()) {
    const data = await this.repository.exportData(userId);
    if (!Object.keys(data).length) {
      throw new ApiError(
        "ACCOUNT_NOT_FOUND",
        404,
        "The account was not found.",
      );
    }
    return {
      format: "deepstudy-personal-data-export",
      version: 1,
      exportedAt: now.toISOString(),
      note:
        "Authentication tokens and private storage keys are intentionally excluded. Uploaded files remain available through their authorised download endpoints.",
      data,
    };
  }

  async deleteAccount(
    userId: string,
    confirmation: string,
    now = new Date(),
  ): Promise<void> {
    if (confirmation !== "DELETE") {
      throw new ApiError(
        "ACCOUNT_DELETE_CONFIRMATION_INVALID",
        400,
        "Type DELETE to confirm account deletion.",
      );
    }
    const resources = await this.repository.resourceStorageKeys(userId);
    for (const resource of resources) {
      try {
        await this.storage.delete(resource.storageKey);
      } catch {
        throw new ApiError(
          "ACCOUNT_FILE_DELETE_FAILED",
          503,
          "A private file could not be deleted. No account data was removed; please retry.",
        );
      }
    }
    const deleted = await this.repository.deleteAccount({
      userId,
      auditId: createId("audit"),
      now: now.toISOString(),
    });
    if (!deleted) {
      throw new ApiError(
        "ACCOUNT_NOT_FOUND",
        404,
        "The account was not found.",
      );
    }
  }
}
