import { SERVER_BASE_URL } from './configs';
import { MediaFile } from './domain/MediaFile';
import { MediaFileJSON, fromJSON } from './domain/deserialise';

export type QueuedFile = {
  file: File,
  onSuccess: (pictureMetadata: MediaFile, remainingLeftInQueue: number) => void,
  onFailure: (response: Response, remainingLeftInQueue: number) => void;
};

export class FileQueue {
  private queue: QueuedFile[] = [];
  private currentUploads = 0;

  constructor(private readonly maxConcurrentUploads: number) {}

  public uploadOrQueue(queuedFile: QueuedFile) {
    if (this.currentUploads === this.maxConcurrentUploads) {
      // no spare slots, so queue it
      this.queue.push(queuedFile);
      return;
    }

    this.upload(queuedFile);
  }

  private upload(queuedFile: QueuedFile) {
    this.currentUploads++;
    const formData = new FormData();
    formData.append('file', queuedFile.file);
    fetch(`${SERVER_BASE_URL}/api/files/`, {
        method: 'POST',
        body: formData,
      })
      .then(response => {
        this.onUploadFinished();
        const uploadsRemaining = this.currentUploads + this.queue.length;

        if (!response.ok) {
          queuedFile.onFailure(response, uploadsRemaining);
          return;
        }

        response.json().then((pictureMetadata: MediaFileJSON) => {
          queuedFile.onSuccess(fromJSON(pictureMetadata), uploadsRemaining);
        });
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
