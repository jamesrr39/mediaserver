import { MediaFile } from "./domain/MediaFile";
import { MediaFileJSON, fromJSON } from "./domain/deserialise";
import { State } from "./reducers/rootReducer";

export type UploadError = { httpCode: number; message: string };

export type FailedUploadResponse = {
  fileName: string;
  success: false;
  error: UploadError;
};

type QueuedFile = {
  file: File;
  onSuccess: (mediaFile: MediaFile) => void;
  onFailure: (fileName: string, error: UploadError) => void;
};

export type MediaFileUploadResponse =
  | { success: true; mediaFile: MediaFile }
  | FailedUploadResponse;

export class FileQueue {
  private queue: QueuedFile[] = [];
  private finishedFiles: MediaFileUploadResponse[] = [];
  private currentlyUploading: QueuedFile[] = [];

  constructor(private readonly maxConcurrentUploads: number) {}

  public async uploadOrQueue(state: State, file: File): Promise<MediaFile> {
    const queuedFile = {
      file,
    } as QueuedFile;

    const promise = new Promise<MediaFile>((resolve, reject) => {
      queuedFile.onSuccess = resolve;
      queuedFile.onFailure = (error) => reject(error);
    });

    if (this.currentlyUploading.length === this.maxConcurrentUploads) {
      // no spare slots, so queue it
      this.queue.push(queuedFile);
    } else {
      // upload directly
      this.upload(state, queuedFile);
    }

    return promise;
  }

  public getStatus() {
    return {
      queued: this.queue,
      currentlyUploading: this.currentlyUploading,
      finished: this.finishedFiles,
    };
  }

  private async upload(state: State, queuedFile: QueuedFile) {
    this.currentlyUploading.push(queuedFile);
    const formData = new FormData();
    formData.append("file", queuedFile.file);

    const response = await fetch(`/api/files/`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok || response.status != 200) {
      let message = response.statusText;
      if (response.ok) {
        // JSON error with message key
        const { message: bodyMessage } = await response.json();
        message = bodyMessage;
      }
      const error = { httpCode: response.status, message };
      this.onUploadFinished(state, queuedFile, {
        fileName: queuedFile.file.name,
        success: false,
        error,
      });
      queuedFile.onFailure(queuedFile.file.name, error);
      return;
    }

    const mediaFileJSON: MediaFileJSON = await response.json();
    const mediaFile = fromJSON(mediaFileJSON);
    this.onUploadFinished(state, queuedFile, { success: true, mediaFile });
    queuedFile.onSuccess(mediaFile);
  }

  private onUploadFinished(
    state: State,
    file: QueuedFile,
    response: MediaFileUploadResponse
  ) {
    this.currentlyUploading.splice(this.currentlyUploading.indexOf(file), 1);
    this.finishedFiles.push(response);

    const nextFile = this.queue.shift();
    if (!nextFile) {
      // queue empty
      return;
    }

    this.upload(state, nextFile);
  }
}
