import { ApiError } from "../../lib/api-errors.ts";
import type { ObjectStorage } from "@deepstudy/storage";

export {
  InMemoryObjectStorage as InMemoryPrivateObjectStorage,
  R2ObjectStorage as R2PrivateObjectStorage,
} from "@deepstudy/storage";
export type {
  ObjectStorage as PrivateObjectStorage,
  R2BucketLike,
  StoredObject,
} from "@deepstudy/storage";

export class UnavailablePrivateObjectStorage
  implements ObjectStorage
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
