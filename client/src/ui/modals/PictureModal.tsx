import * as React from 'react';
import { PictureMetadata } from '../../domain/PictureMetadata';
import { SERVER_BASE_URL } from '../../configs';
import { THUMBNAIL_HEIGHTS } from '../../generated/thumbnail_sizes';
import { INFO_CONTAINER_WIDTH } from './FileInfoComponent';
import { joinUrlFragments } from '../../util/url';
import { Observable } from '../../util/Observable';
import { connect } from 'react-redux';
import { State } from '../../reducers/fileReducer';

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
  resizeObservable: Observable<void>,
};

class PictureModal extends React.Component<Props> {
  private pictureEl: HTMLImageElement|null = null;
  private divContainerEl: HTMLDivElement|null = null;

  componentDidMount() {
    this.props.resizeObservable.addListener(this.onResize);
  }

  componentWillUnmount() {
    this.props.resizeObservable.removeListener(this.onResize);
  }

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

  private onResize = () => {
    this.setState(state => ({...state}));
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
    console.log('size', el.clientWidth, el.clientHeight, el);
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

    const url = joinUrlFragments(SERVER_BASE_URL, 'picture', `${pictureMetadata.hashValue}?h=${chosenHeight}`);
    pictureEl.style.maxHeight = `${idealHeight}px`;
    pictureEl.style.maxWidth = `${idealWidth}px`;
    pictureEl.src = url;
  }
}

export default connect((state: State) => {
  const { resizeObservable } = state.dependencyInjection;
  
  return {
    resizeObservable
  };
})(PictureModal);