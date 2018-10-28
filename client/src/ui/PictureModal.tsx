import * as React from 'react';
import { State } from '../reducers';
import { connect, Dispatch } from 'react-redux';
import { PictureMetadata } from '../domain/PictureMetadata';
import { SERVER_BASE_URL } from '../configs';
import { Link, withRouter } from 'react-router-dom';
import { Action } from 'redux';
import { THUMBNAIL_HEIGHTS } from '../generated/thumbnail_sizes';
import { Observable } from '../util/Observable';
import { compose } from 'redux';
import { History } from 'history';
import PictureInfoComponent, { INFO_CONTAINER_WIDTH } from './PictureInfoComponent';
import { isNarrowScreen } from '../util/screen_size';
import { MediaFile, MediaFileType } from '../domain/MediaFile';
import Modal from './Modal';
import { TrackModalContent } from './TrackModalContent';
import { FitTrack } from '../domain/FitTrack';

const KeyCodes = {
  ESCAPE: 27,
  LEFT_ARROW: 37,
  RIGHT_ARROW: 39,
};

enum Subview {
  INFO = 'info'
}

type Props = {
  hash: string,
  history: History,
  picturesMetadatas: MediaFile[],
  dispatch: Dispatch<Action>,
  scrollObservable: Observable,
  baseUrl: string, // for example, /gallery
  subview?: Subview,
};

const styles = {
  modalBody: {
    display: 'flex',
    height: '100%',
  } as React.CSSProperties,
  pictureInfoContainer: {
    backgroundColor: '#333',
    height: '100%',
    padding: '40px 10px 0',
    flex: `0 0 ${INFO_CONTAINER_WIDTH}px`,
  },
  pictureContainer: {
    width: '100%',
    height: '100%',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  } as React.CSSProperties,
  navigationButton: {
    color: 'white',
    textDecoration: 'none',
    fontSize: '2em',
    width: '50px',
    height: '50px',
    lineHeight: '50px',
    textAlign: 'center',
    verticalAlign: 'middle',
    backgroundColor: 'transparent',
    borderStyle: 'none',
  },
  topBar: {
    position: 'fixed',
    display: 'flex',
    justifyContent: 'space-between',
    width: '100%',
  } as React.CSSProperties,
};

type ComponentState = {
  showInfo: boolean;
};

class PictureModal extends React.Component<Props, ComponentState> {
  state = {
    showInfo: false
  };

  private pictureEl: HTMLImageElement|null;

  private pictureMetadata: MediaFile | null = null;
  private previousPictureMetadata: MediaFile | null = null;
  private nextPictureMetadata: MediaFile | null = null;

  setRenderData() {
    const { picturesMetadatas, hash } = this.props;
    let i;

    for (i = 0; i < picturesMetadatas.length; i++) {
      if (picturesMetadatas[i].hashValue === hash) {
        if (i !== 0) {
          this.previousPictureMetadata = picturesMetadatas[i - 1];
        } else {
          this.previousPictureMetadata = null;
        }
        this.pictureMetadata = picturesMetadatas[i];
        if (i !== picturesMetadatas.length - 1) {
          this.nextPictureMetadata = picturesMetadatas[i + 1];
        } else {
          this.nextPictureMetadata = null;
        }

        break;
      }
    }
  }

  listenToResize = () => {
    this.setState(state => ({...state}));
  }

  componentDidMount() {
    document.addEventListener('keyup', this.listenToKeyUp);
    this.props.scrollObservable.addListener(this.listenToResize);
  }

  componentWillUnmount() {
    document.removeEventListener('keyup', this.listenToKeyUp);
    this.props.scrollObservable.removeListener(this.listenToResize);
  }

  render() {
    this.setRenderData();

    if (this.pictureMetadata === null) {
      return (<p>Image not found</p>);
    }

    const refCb = this.createRefCallback();

    return (
      <Modal>
        {this.renderTopBar(this.pictureMetadata)}
        <div style={styles.modalBody} ref={refCb}>
          {this.renderModalBody(this.pictureMetadata)}
        </div>
      </Modal>
    );
  }

  private renderModalBody = (pictureMetadata: MediaFile) => {
    if (isNarrowScreen()) {
      if (this.state.showInfo) {
        return this.renderInfoContainer(pictureMetadata);
      }
      return this.renderPicture(pictureMetadata);
    }
    return (
      <React.Fragment>
        {this.renderPicture(pictureMetadata)}
        {this.state.showInfo && this.renderInfoContainer(pictureMetadata)}
      </React.Fragment>
    );
  }

  private renderInfoContainer = (pictureMetadata: MediaFile) => {
    return (
      <div style={styles.pictureInfoContainer}>
        <PictureInfoComponent {...{pictureMetadata}} />
      </div>
    );
  }

  private renderPicture = (pictureMetadata: MediaFile) => {
    const previousLink = this.renderPreviousLink();
    const nextLink = this.renderNextLink();

    return (
      <div style={styles.pictureContainer}>
        <div>{previousLink}</div>
        <React.Fragment>
          {this.renderPictureContent(pictureMetadata)}
        </React.Fragment>
        <div>{nextLink}</div>
      </div>
    );
  }

  private renderPictureContent = (mediaFile: MediaFile) => {
    switch (mediaFile.fileType) {
      case MediaFileType.Picture:
        return <img ref={(el) => {this.pictureEl = el; }} />;
      case MediaFileType.Video:
        const videoUrl = `${SERVER_BASE_URL}/video/${mediaFile.hashValue}`;
        return (
          <video width="100%" controls={true} key={mediaFile.hashValue}>
            <source src={videoUrl} />
            Your browser does not support HTML5 video.
          </video>
        );
      case MediaFileType.FitTrack:
        const props = {
          trackSummary: mediaFile as FitTrack,
        };
        return <TrackModalContent {...props} />;
      default:
        return <p>Unknown format</p>;
    }
  }

  private renderTopBar = (pictureMetadata: MediaFile) => {
    const pictureURL = `${SERVER_BASE_URL}/picture/${pictureMetadata.hashValue}`;

    return (
      <div style={styles.topBar}>
        <Link to={this.props.baseUrl} style={styles.navigationButton}>&#x274C;</Link>
        <div>
          <button
            onClick={() => this.setState((state) => ({...state, showInfo: !state.showInfo}))}
            style={styles.navigationButton}
            className="fa fa-info-circle"
            aria-label="Info"
          />
          <a
            href={pictureURL}
            download={encodeURIComponent(pictureMetadata.getName())}
            style={styles.navigationButton}
            className="fa fa-download"
            aria-label="Download"
          />
        </div>
      </div>
    );
  }

  private createRefCallback = () => (divContainerEl: HTMLDivElement|null) => {
    if (divContainerEl === null || this.pictureEl === null || this.pictureMetadata === null) {
      return;
    }

    const pictureMetadata = this.pictureMetadata;
    switch (pictureMetadata.fileType) {
      case MediaFileType.Picture:
        this.createRefCallbackForPicture(
          divContainerEl, this.pictureEl, pictureMetadata as PictureMetadata); // todo remove cast
        break;
      default:
        return;
    }
  }

  private createRefCallbackForPicture = (
    divContainerEl: HTMLDivElement, pictureEl: HTMLImageElement, pictureMetadata: PictureMetadata) => {
    const idealHeight = (divContainerEl.clientHeight);
    const infoContainerWidth = this.state.showInfo ? INFO_CONTAINER_WIDTH : 0;
    const idealWidth = (divContainerEl.clientWidth - 100) - infoContainerWidth;

    const aspectRatio = pictureMetadata.rawSize.width / pictureMetadata.rawSize.height;

    let chosenHeight = THUMBNAIL_HEIGHTS.find((height) => {
      const width = Math.round(height * aspectRatio);
      if (height >= idealHeight || width >= idealWidth) {
        return true;
      }
      return false;
    });
    if (!chosenHeight) {
      chosenHeight = pictureMetadata.rawSize.height;
    }

    const url = `${SERVER_BASE_URL}/picture/${pictureMetadata.hashValue}?h=${chosenHeight}`;
    pictureEl.style.maxHeight = `${idealHeight}px`;
    pictureEl.style.maxWidth = `${idealWidth}px`;
    pictureEl.src = url;
  }

  private renderPreviousLink = () => {
    return this.previousPictureMetadata
      ? (
        <Link
          to={`${this.props.baseUrl}/picture/${this.previousPictureMetadata.hashValue}`}
          style={styles.navigationButton}
        >
          &larr;
        </Link>
      )
      : <span style={styles.navigationButton} />;
  }

  private renderNextLink = () => {
    return this.nextPictureMetadata
      ? (
        <Link
          to={`${this.props.baseUrl}/picture/${this.nextPictureMetadata.hashValue}`}
          style={styles.navigationButton}
        >
          &rarr;
        </Link>
      )
      : <span style={styles.navigationButton} />;
  }

  private goBack = () => {
    this.props.history.push(this.props.baseUrl);
  }

  private goToPrevious = () => {
    if (this.previousPictureMetadata !== null) {
      this.props.history.push(`${this.props.baseUrl}/picture/${this.previousPictureMetadata.hashValue}`);
    }
  }

  private goToNext = () => {
    if (this.nextPictureMetadata !== null) {
      this.props.history.push(`${this.props.baseUrl}/picture/${this.nextPictureMetadata.hashValue}`);
    }
  }

  private listenToKeyUp = (event: KeyboardEvent) => {
    switch (event.keyCode) {
      case KeyCodes.ESCAPE:
        this.goBack();
        return;
      case KeyCodes.LEFT_ARROW:
        this.goToPrevious();
        return;
      case KeyCodes.RIGHT_ARROW:
        this.goToNext();
        return;
      default:
        return;
    }
  }
}

function mapStateToProps(state: State) {
  const { scrollObservable } = state.picturesMetadatas;

  return {
    scrollObservable,
  };
}

export default compose(
  withRouter,
  connect(mapStateToProps)
)(PictureModal);
