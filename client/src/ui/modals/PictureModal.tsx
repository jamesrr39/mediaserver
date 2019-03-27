import * as React from 'react';
import { PictureMetadata } from '../../domain/PictureMetadata';
import { SERVER_BASE_URL } from '../../configs';
import { THUMBNAIL_HEIGHTS } from '../../generated/thumbnail_sizes';
import { INFO_CONTAINER_WIDTH } from '../PictureInfoComponent';
import { joinUrlFragments } from '../../util/url';

const styles = {
  container: {
    height: '100vh',
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
  },
  image: {
    margin: 'auto 0',
  },
};

type Props = {
  pictureMetadata: PictureMetadata,
  showInfo: boolean,
};

class PictureModal extends React.Component<Props> {
  private pictureEl: HTMLImageElement|null = null;

  render() {
    return (
      <div ref={el => this.createRefCallback(el)} style={styles.container}>
        <img style={styles.image} ref={(el) => {this.pictureEl = el; }} />
      </div>
    );
  }

  private createRefCallback = (divContainerEl: HTMLDivElement|null) => {
    const {pictureMetadata} = this.props;

    if (divContainerEl === null || this.pictureEl === null) {
      return;
    }

    this.createRefCallbackForPicture(divContainerEl, this.pictureEl, pictureMetadata);
  }

  private createRefCallbackForPicture = (
    divContainerEl: HTMLDivElement, pictureEl: HTMLImageElement, pictureMetadata: PictureMetadata) => {
    const idealHeight = (divContainerEl.clientHeight);
    const infoContainerWidth = this.props.showInfo ? INFO_CONTAINER_WIDTH : 0;
    const idealWidth = divContainerEl.clientWidth - infoContainerWidth;

    const aspectRatio = pictureMetadata.rawSize.width / pictureMetadata.rawSize.height;

    let chosenHeight = THUMBNAIL_HEIGHTS.find((height) => {
      const width = Math.round(height * aspectRatio);
      return (height >= idealHeight || width >= idealWidth);
    });
    if (!chosenHeight) {
      chosenHeight = pictureMetadata.rawSize.height;
    }

    const url = joinUrlFragments(SERVER_BASE_URL, 'picture', `${pictureMetadata.hashValue}?h=${chosenHeight}`);
    pictureEl.style.maxHeight = `${idealHeight}px`;
    pictureEl.style.maxWidth = `${idealWidth}px`;
    pictureEl.src = url;
  }
}

export default PictureModal;