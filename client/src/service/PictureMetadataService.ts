import { PictureMetadata } from '../domain/PictureMetadata';

export interface PictureMetadataService {
  getAll(): Promise<PictureMetadata[]>;
}

export class LocalhostPictureMetadataService implements PictureMetadataService {
  getAll(): Promise<PictureMetadata[]> {
    return fetch('/api/pictureMetadata/').then((response) => {
      return response.json();
    });
  }
}
