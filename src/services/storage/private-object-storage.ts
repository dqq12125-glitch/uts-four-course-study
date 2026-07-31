import { ApiError } from "../../lib/api-errors.ts";

export interface StoredObject {
  body: ReadableStream<Uint8Array>;
  size?: number;
  httpMetadata?: { contentType?: string };
}

export interface R2BucketLike {
  put(
    key: string,
    value: ArrayBuffer | Uint8Array,
    options?: {
      httpMetadata?: { contentType?: string };
      customMetadata?: Record<string, string>;
    },
  ): Promise<unknown>;
  get(key: string): Promise<StoredObject | null>;
  delete(key: string): Promise<void>;
}

export interface PrivateObjectStorage {
  put(
    key: string,
    bytes: Uint8Array,
    contentType: string,
  ): Promise<void>;
  get(key: string): Promise<Uint8Array | null>;
  delete(key: string): Promise<void>;
}

export class R2PrivateObjectStorage implements PrivateObjectStorage {
  private readonly bucket: R2BucketLike;

  constructor(bucket: R2BucketLike) {
    this.bucket = bucket;
  }

  async put(
    key: string,
    bytes: Uint8Array,
    contentType: string,
  ): Promise<void> {
    await this.bucket.put(key, bytes, {
      httpMetadata: { contentType },
      customMetadata: { privacy: "private" },
    });
  }

  async get(key: string): Promise<Uint8Array | null> {
    const object = await this.bucket.get(key);
    if (!object) return null;
    return new Uint8Array(await new Response(object.body).arrayBuffer());
  }

  async delete(key: string): Promise<void> {
    await this.bucket.delete(key);
  }
}

export class InMemoryPrivateObjectStorage
  implements PrivateObjectStorage
{
  private readonly objects = new Map<string, Uint8Array>();

  async put(
    key: string,
    bytes: Uint8Array,
    _contentType: string,
  ): Promise<void> {
    void _contentType;
    this.objects.set(key, bytes.slice());
  }

  async get(key: string): Promise<Uint8Array | null> {
    return this.objects.get(key)?.slice() ?? null;
  }

  async delete(key: string): Promise<void> {
    this.objects.delete(key);
  }
}

export class UnavailablePrivateObjectStorage
  implements PrivateObjectStorage
{
  private fail(): never {
    throw new ApiError(
      "FILE_STORAGE_NOT_CONFIGURED",
      503,
      "Private file storage is not configured for this environment.",
    );
  }

  async put(
    _key: string,
    _bytes: Uint8Array,
    _contentType: string,
  ): Promise<void> {
    void _key;
    void _bytes;
    void _contentType;
    this.fail();
  }

  async get(_key: string): Promise<Uint8Array | null> {
    void _key;
    return this.fail();
  }

  async delete(_key: string): Promise<void> {
    void _key;
    this.fail();
  }
}
