import type { z } from "zod";

export interface JobEnvelope {
  id: string;
  kind: string;
  idempotencyKey: string;
  payload: unknown;
  attempt: number;
  createdAt: string;
}

export interface EnqueueJobInput {
  id: string;
  kind: string;
  idempotencyKey: string;
  payload: unknown;
  createdAt?: string;
}

export interface EnqueuedJob {
  jobId: string;
  duplicate: boolean;
  status: "completed";
}

export interface RetryPolicy {
  maxAttempts: number;
  shouldRetry(error: unknown, attempt: number): boolean;
}

export const defaultRetryPolicy: RetryPolicy = {
  maxAttempts: 3,
  shouldRetry: (_error, attempt) => attempt < 3,
};

export type JobHandler<T> = (job: JobEnvelope & { payload: T }) => Promise<void>;

export interface JobQueue {
  register<T>(kind: string, schema: z.ZodType<T>, handler: JobHandler<T>): void;
  enqueue(input: EnqueueJobInput): Promise<EnqueuedJob>;
}

interface RegisteredJob {
  schema: z.ZodType<unknown>;
  handler: JobHandler<unknown>;
}

export class InlineJobQueue implements JobQueue {
  private readonly handlers = new Map<string, RegisteredJob>();
  private readonly completedKeys = new Set<string>();
  private readonly retryPolicy: RetryPolicy;

  constructor(retryPolicy: RetryPolicy = defaultRetryPolicy) {
    if (retryPolicy.maxAttempts < 1) {
      throw new Error("Job maxAttempts must be at least one.");
    }
    this.retryPolicy = retryPolicy;
  }

  register<T>(
    kind: string,
    schema: z.ZodType<T>,
    handler: JobHandler<T>,
  ): void {
    if (this.handlers.has(kind)) {
      throw new Error(`A handler is already registered for ${kind}.`);
    }
    this.handlers.set(kind, {
      schema: schema as z.ZodType<unknown>,
      handler: handler as JobHandler<unknown>,
    });
  }

  async enqueue(input: EnqueueJobInput): Promise<EnqueuedJob> {
    if (this.completedKeys.has(input.idempotencyKey)) {
      return { jobId: input.id, duplicate: true, status: "completed" };
    }
    const registered = this.handlers.get(input.kind);
    if (!registered) throw new Error(`No handler registered for ${input.kind}.`);
    const payload = registered.schema.parse(input.payload);

    let attempt = 0;
    while (attempt < this.retryPolicy.maxAttempts) {
      attempt += 1;
      try {
        await registered.handler({
          ...input,
          payload,
          attempt,
          createdAt: input.createdAt ?? new Date().toISOString(),
        });
        this.completedKeys.add(input.idempotencyKey);
        return { jobId: input.id, duplicate: false, status: "completed" };
      } catch (error) {
        if (!this.retryPolicy.shouldRetry(error, attempt)) throw error;
      }
    }
    throw new Error(`Job ${input.id} exhausted its retry policy.`);
  }
}
