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
  private currentUploads = 0;

  constructor(private readonly maxConcurrentUploads: number) {}

  public async uploadOrQueue(file: File): Promise<MediaFile> {
    const queuedFile = {
      file,
    } as QueuedFile;

    const promise = new Promise<MediaFile>((resolve, reject) => {
      // queuedFile.onSuccess = (mediaFile) => resolve({mediaFile});
      queuedFile.onSuccess = resolve;
      queuedFile.onFailure = (error) => reject(error);
    });
    
    if (this.currentUploads === this.maxConcurrentUploads) {
      // no spare slots, so queue it
      this.queue.push(queuedFile);
    } else {
      // upload directly
      this.upload(queuedFile);
    }

    return promise;
  }

  public getQtyUploadsRemaining() {
    return this.currentUploads + this.queue.length;
  }

  private async upload(queuedFile: QueuedFile) {
    this.currentUploads++;
    const formData = new FormData();
    formData.append('file', queuedFile.file);
    const response = await fetch(`${SERVER_BASE_URL}/api/files/`, {
      method: 'POST',
      body: formData,
    });
    
    this.onUploadFinished();

    if (!response.ok) {
      queuedFile.onFailure(new Error(response.statusText));
      return;
    }

    response.json().then((mediaFileJSON: MediaFileJSON) => {
      queuedFile.onSuccess(fromJSON(mediaFileJSON));
    });
  }

  private onUploadFinished() {
    this.currentUploads--;

    const nextFile = this.queue.shift();
    if (!nextFile) {
      // queue empty
      return;
    }

    this.upload(nextFile);
  }
}
