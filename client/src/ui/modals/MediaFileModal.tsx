import * as React from 'react';
import { State } from '../../reducers/fileReducer';
import { connect } from 'react-redux';
import { SERVER_BASE_URL } from '../../configs';
import { Link } from 'react-router-dom';
import { Action, Dispatch } from 'redux';
import { Observable } from '../../util/Observable';
import { compose } from 'redux';
import PictureInfoComponent, { INFO_CONTAINER_WIDTH } from '../PictureInfoComponent';
import { isNarrowScreen } from '../../util/screen_size';
import { MediaFile } from '../../domain/MediaFile';
import { MediaFileType } from '../../domain/MediaFileType';
import Modal from '../Modal';
import TrackModalContent from './TrackModalContent';
import { joinUrlFragments } from '../../util/url';
import VideoModal from './VideoModal';
import PictureModal from './PictureModal';

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
  mediaFiles: MediaFile[],
  dispatch: Dispatch<Action>,
  scrollObservable: Observable<{}>,
  baseUrl: string, // for example, /gallery
  subview?: Subview,
};

const styles = {
  modalBody: {
    display: 'flex' as 'flex',
    height: '100%',
  },
  pictureInfoContainer: {
    backgroundColor: '#333',
    height: '100%',
    padding: '40px 10px 0',
    flex: `0 0 ${INFO_CONTAINER_WIDTH}px`,
  },
  contentContainer: {
    width: '100%',
    height: '100%',
    display: 'flex' as 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  navigationButton: {
    color: 'white',
    textDecoration: 'none',
    fontSize: '2em',
    width: '50px',
    height: '50px',
    lineHeight: '50px',
    align: 'center',
    verticalAlign: 'middle',
    backgroundColor: 'transparent',
    borderStyle: 'none',
  },
  topBar: {
    position: 'fixed' as 'fixed',
    display: 'flex',
    justifyContent: 'space-between',
    width: '100%',
  },
};

const navButtonTextStyle = {
  ...styles.navigationButton,
  position: 'absolute' as 'absolute',
  backgroundColor: '#666',
  opacity: 0.8,
  zIndex: 1000,
  textAlign: 'center',
};

type ComponentState = {
  showInfo: boolean;
};

class MediaFileModal extends React.Component<Props, ComponentState> {
  state = {
    showInfo: false
  };

  private mediaFile: MediaFile | null = null;
  private previousPictureMetadata: MediaFile | null = null;
  private nextPictureMetadata: MediaFile | null = null;

  setRenderData() {
    const { mediaFiles: mediaFiles, hash } = this.props;
    let i;

    for (i = 0; i < mediaFiles.length; i++) {
      if (mediaFiles[i].hashValue === hash) {
        if (i !== 0) {
          this.previousPictureMetadata = mediaFiles[i - 1];
        } else {
          this.previousPictureMetadata = null;
        }
        this.mediaFile = mediaFiles[i];
        if (i !== mediaFiles.length - 1) {
          this.nextPictureMetadata = mediaFiles[i + 1];
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

    if (this.mediaFile === null) {
      return (<p>Image not found</p>);
    }

    return (
      <Modal>
        {this.renderTopBar(this.mediaFile)}
        <div style={styles.modalBody}>
          {this.renderModalBody(this.mediaFile)}
        </div>
      </Modal>
    );
  }

  private renderModalBody = (mediaFile: MediaFile) => {
    if (isNarrowScreen()) {
      if (this.state.showInfo) {
        return this.renderInfoContainer(mediaFile);
      }
      return this.renderMediaFile(mediaFile);
    }
    return (
      <React.Fragment>
        {this.renderMediaFile(mediaFile)}
        {this.state.showInfo && this.renderInfoContainer(mediaFile)}
      </React.Fragment>
    );
  }

  private renderInfoContainer = (mediaFile: MediaFile) => {
    return (
      <div style={styles.pictureInfoContainer}>
        <PictureInfoComponent {...{mediaFile}} />
      </div>
    );
  }

  private renderMediaFile = (mediaFile: MediaFile) => {
    const previousLink = this.renderPreviousLink();
    const nextLink = this.renderNextLink();

    return (
      <div style={styles.contentContainer}>
        <div>{previousLink}</div>
        <React.Fragment>
          {this.renderMediaFileContent(mediaFile)}
        </React.Fragment>
        <div>{nextLink}</div>
      </div>
    );
  }

  private renderMediaFileContent = (mediaFile: MediaFile) => {
    const {showInfo} = this.state;

    switch (mediaFile.fileType) {
      case MediaFileType.Picture: {
        const props = {
          pictureMetadata: mediaFile,
          scrollObservable: this.props.scrollObservable,
          showInfo,
        };
        return <PictureModal {...props} />;
      }
      case MediaFileType.Video:
        return <VideoModal {...{mediaFile}} />;
      case MediaFileType.FitTrack: {
        const props = {
          trackSummary: mediaFile,
        };
        return <TrackModalContent {...props} />;
      }
      default:
        return <p>Unknown format</p>;
    }
  }

  private renderTopBar = (pictureMetadata: MediaFile) => {
    const pictureURL = joinUrlFragments(SERVER_BASE_URL, 'picture', pictureMetadata.hashValue);

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

  private renderPreviousLink = () => {
    const style = {
      ...navButtonTextStyle,
      left: '0px',
    };

    return this.previousPictureMetadata
      ? (
        <Link
          to={`${this.props.baseUrl}/detail/${this.previousPictureMetadata.hashValue}`}
          style={style}
          aria-label="previous"
        >
          &larr;
        </Link>
      )
      : null;
  }

  private renderNextLink = () => {
    const style = {
      ...navButtonTextStyle,
      right: '0px',
    };

    return this.nextPictureMetadata
      ? (
        <Link
          to={`${this.props.baseUrl}/detail/${this.nextPictureMetadata.hashValue}`}
          style={style}
          aria-label="next"
        >
          &rarr;
        </Link>
      )
      : null;
  }

  private goBack = () => {
    window.location.hash = `#${this.props.baseUrl}`;
  }

  private goToPrevious = () => {
    if (this.previousPictureMetadata !== null) {
      window.location.hash = `#${this.props.baseUrl}/detail/${this.previousPictureMetadata.hashValue}`;
    }
  }

  private goToNext = () => {
    if (this.nextPictureMetadata !== null) {
      window.location.hash = `#${this.props.baseUrl}/detail/${this.nextPictureMetadata.hashValue}`;
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
  const { scrollObservable } = state.mediaFilesReducer;

  return {
    scrollObservable,
  };
}

export default compose(
  connect(mapStateToProps)
)(MediaFileModal);
