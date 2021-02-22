import * as React from 'react';
import { PictureMetadata } from '../../domain/PictureMetadata';
import { THUMBNAIL_HEIGHTS } from '../../generated/thumbnail_sizes';
import { INFO_CONTAINER_WIDTH } from './FileInfoComponent';
import { connect } from 'react-redux';
import { State } from '../../reducers/rootReducer';
import { WindowState } from '../../reducers/windowReducer';

const styles = {
  container: {
    height: '100%',
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
  windowSize: WindowState,
};

class PictureModal extends React.Component<Props> {
  private pictureEl: HTMLImageElement|null = null;
  private divContainerEl: HTMLDivElement|null = null;

  render() {
    return (
      <div
        ref={el => this.createRefCallback(el)}
        style={styles.container}
        className="picture-modal-container"
      >
        <img style={styles.image} ref={(el) => this.createPictureEl(el)} />
      </div>
    );
  }

  private createPictureEl = (el: HTMLImageElement|null) => {
    if (!el) {
      return;
    }

    this.pictureEl = el;

    if (this.pictureEl && this.divContainerEl) {
      this.createRefCallbackForPicture(this.divContainerEl, this.pictureEl);
    }
  }

  private createRefCallback = (el: HTMLDivElement|null) => {
    if (!el) {
      return;
    }
    this.divContainerEl = el;

    if (this.pictureEl && this.divContainerEl) {
      this.createRefCallbackForPicture(this.divContainerEl, this.pictureEl);
    }
  }

  private createRefCallbackForPicture = (divContainerEl: HTMLDivElement, pictureEl: HTMLImageElement) => {
    const {pictureMetadata} = this.props;

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

    const url = `file/picture/${encodeURIComponent(pictureMetadata.hashValue)}?h=${encodeURIComponent(chosenHeight)}`;
    pictureEl.style.maxHeight = `${idealHeight}px`;
    pictureEl.style.maxWidth = `${idealWidth}px`;
    pictureEl.src = url;
  }
}

export default connect((state: State) => {
  return {
    windowSize: state.windowReducer,
  };
})(PictureModal);