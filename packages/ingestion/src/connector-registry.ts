import type { ConnectorId, LMSConnector } from "@deepstudy/shared-types";

export type ConnectorFactory = () => LMSConnector;

export class ConnectorRegistry {
  private readonly factories = new Map<ConnectorId, ConnectorFactory>();

  register(id: ConnectorId, factory: ConnectorFactory): void {
    if (this.factories.has(id)) {
      throw new Error(`Connector ${id} is already registered.`);
    }
    this.factories.set(id, factory);
  }

  create(id: ConnectorId): LMSConnector {
    const factory = this.factories.get(id);
    if (!factory) throw new Error(`Connector ${id} is not registered.`);
    const connector = factory();
    if (connector.id !== id) {
      throw new Error(`Connector factory ${id} returned ${connector.id}.`);
    }
    return connector;
  }

  list(): ConnectorId[] {
    return [...this.factories.keys()];
  }
}
