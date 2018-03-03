import * as React from 'react';
import { PictureMetadataService } from '../service/PictureMetadataService';
import { PictureMetadata } from '../domain/PictureMetadata';
import { Gallery } from './Gallery';
import { Observable } from '../util/Observable';

export interface MediaServerProps {
  pictureMetadataService: PictureMetadataService;
  scrollObservable: Observable;
}

export interface MediaServerState {
  picturesMetadatas: null|PictureMetadata[];
}

export class MediaServer extends React.Component<MediaServerProps, MediaServerState> {
  constructor(props: MediaServerProps) {
    super(props);
    this.state = {picturesMetadatas: null};

    props.pictureMetadataService.getAll().then(picturesMetadatas => {
      const newState = {
        picturesMetadatas
      };
      this.setState(newState, () => this.props.scrollObservable.triggerEvent());
    });
  }

  generateGallery() {
    if (this.state.picturesMetadatas === null) {
      return <p>Loading</p>;
    }

    const galleryProps = {
      picturesMetadatas: this.state.picturesMetadatas,
      scrollObservable: this.props.scrollObservable,
    };
    return <Gallery {...galleryProps} />;
  }

  render() {
    const gallery = this.generateGallery();

    return (
      <div>
        Photos
        {gallery}
      </div>
    );
  }
}
