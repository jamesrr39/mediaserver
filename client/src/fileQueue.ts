import { SERVER_BASE_URL } from './configs';
import { MediaFile } from './domain/MediaFile';
import { MediaFileJSON, fromJSON } from './domain/deserialise';

type QueuedFile = {
  file: File,
  onSuccess: (mediaFile: MediaFile) => void,
  onFailure: (error: Error) => void;
};

export type MediaFileUploadResponse = {mediaFile: MediaFile} | {error: Error};

export class FileQueue {
  private queue: QueuedFile[] = [];
  private finishedFiles: MediaFileUploadResponse[] = [];
  private currentlyUploading: QueuedFile[] = [];

  constructor(private readonly maxConcurrentUploads: number) {}

  public async uploadOrQueue(file: File): Promise<MediaFile> {
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
      this.upload(queuedFile);
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

  private async upload(queuedFile: QueuedFile) {
    this.currentlyUploading.push(queuedFile);
    const formData = new FormData();
    formData.append('file', queuedFile.file);
    const response = await fetch(`${SERVER_BASE_URL}/api/files/`, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      const error = new Error(response.statusText);
      this.onUploadFinished(queuedFile, {error});
      queuedFile.onFailure(error);
      return;
    }

    response.json().then((mediaFileJSON: MediaFileJSON) => {
      const mediaFile = fromJSON(mediaFileJSON);
      this.onUploadFinished(queuedFile, {mediaFile});
      queuedFile.onSuccess(mediaFile);
    });
  }

  private onUploadFinished(file: QueuedFile, response: MediaFileUploadResponse) {
    this.currentlyUploading.splice(this.currentlyUploading.indexOf(file), 1);
    this.finishedFiles.push(response);

    const nextFile = this.queue.shift();
    if (!nextFile) {
      // queue empty
      return;
    }

    this.upload(nextFile);
  }
}
