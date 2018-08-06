import { SERVER_BASE_URL } from './configs';
import { PictureMetadata } from './domain/PictureMetadata';

export type QueuedFile = {
  file: File,
  onSuccess: (pictureMetadata: PictureMetadata, remainingLeftInQueue: number) => void,
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
    fetch(`${SERVER_BASE_URL}/picture/`, {
        method: 'POST',
        body: formData,
      })
      .then(response => {
        this.onUploadFinished();

        if (!response.ok) {
          queuedFile.onFailure(response, this.currentUploads);
          return;
        }

        response.json().then((pictureMetadata) => {
          queuedFile.onSuccess(pictureMetadata, this.currentUploads);
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
