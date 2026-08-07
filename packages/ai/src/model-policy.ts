import type { ModelCapability } from "@deepstudy/shared-types";

export interface ModelPolicy {
  select(capability: ModelCapability): string;
}

export interface ModelPolicyConfiguration {
  low: string;
  medium: string;
  high: string;
}

export class StaticModelPolicy implements ModelPolicy {
  private readonly configuration: ModelPolicyConfiguration;

  constructor(configuration: ModelPolicyConfiguration) {
    this.configuration = configuration;
  }

  select(capability: ModelCapability): string {
    return this.configuration[capability];
  }
}
