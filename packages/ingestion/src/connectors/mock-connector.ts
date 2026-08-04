import type { ConnectionResult } from "@deepstudy/shared-types";
import {
  ManualUploadConnector,
  type ManualUploadConnectorData,
} from "./manual-upload-connector.ts";

export class MockConnector extends ManualUploadConnector {
  override readonly id = "mock" as const;

  constructor(data: ManualUploadConnectorData = {}) {
    super({ ...data, displayName: data.displayName ?? "Mock LMS" });
  }

  override async connect(): Promise<ConnectionResult> {
    return {
      connectorId: this.id,
      status: "connected",
      displayName: this.data.displayName,
      readOnly: true,
      connectedAt: new Date().toISOString(),
      message: "Deterministic connector for development and contract tests.",
    };
  }
}
