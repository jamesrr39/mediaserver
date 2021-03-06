import * as React from 'react';
import { State } from '../../reducers/rootReducer';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { Action, Dispatch } from 'redux';
import { compose } from 'redux';
import FileInfoComponent from './FileInfoComponent';
import { isNarrowScreen } from '../../util/screen_size';
import { MediaFile } from '../../domain/MediaFile';
import { MediaFileType } from '../../domain/MediaFileType';
import Modal from '../Modal';
import TrackModalContent from './TrackModalContent';
import VideoModal from './VideoModal';
import PictureModal from './PictureModal';
import ModalTopBar from './ModalTopBar';

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
  baseUrl: string, // for example, /gallery
  subview?: Subview,
};

const styles = {
  narrowScreenPictureInfoContainer: {
    backgroundColor: '#333',
    height: '100%',
    padding: '40px 10px 0',
    flex: `0 1 auto`,
    width: '100%',
  },
  narrowScreenContentContainer: {
    width: 'auto',
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
  wideScreen: {
    contentContainer: {
      height: '100%',
      flexGrow: 1,
      display: 'flex' as 'flex',
      // alignItems: 'center',
      justifyContent: 'space-between',
    },
    pictureInfoContainer: {
      height: '100%',
      width: '400px',
    },  
  },
};

const navButtonTextStyle = {
  ...styles.navigationButton,
  backgroundColor: '#666',
  opacity: 0.8,
  zIndex: 1000,
  textAlign: 'center' as 'center',
  top: '50%',
  position: 'absolute' as 'absolute',
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

  componentDidMount() {
    document.addEventListener('keyup', this.listenToKeyUp);
  }

  componentWillUnmount() {
    document.removeEventListener('keyup', this.listenToKeyUp);
  }

  render() {
    this.setPreviousNextData();
    const {mediaFile} = this;
    const {baseUrl} = this.props;

    if (mediaFile === null) {
      return (<p>Image not found</p>);
    }

    const narrowScreen = isNarrowScreen();
    if (this.state.showInfo && narrowScreen) {
      const onCloseButtonClicked = () => this.setState(state => ({...state, showInfo: false}));
      return (
        <Modal>
          <FileInfoComponent {...{mediaFile, onCloseButtonClicked}} />
        </Modal>
      );
    }

    const topBarProps = {
      mediaFile,
      baseUrl,
      onInfoButtonClicked: () => this.setState((state) => ({...state, showInfo: !state.showInfo}))
    };

    const s = {
      display: 'flex',
      width: '100%',
      height: '100%',
    };

    const childS = {
      flex: '1'
    };

    return (
      <Modal>
        <div style={s}>
          <div style={childS}>
            <ModalTopBar {...topBarProps} />
            {this.renderModalBody(mediaFile)}
          </div>
          {this.state.showInfo && (
            <div style={styles.wideScreen.pictureInfoContainer}>
              <FileInfoComponent {...{mediaFile}} />
            </div>
          )}
        </div>
      </Modal>
    );
  }

  private renderModalBody = (mediaFile: MediaFile) => {
    const narrowScreen = isNarrowScreen();
    return narrowScreen ? this.renderNarrowScreenModalBody(mediaFile) : this.renderWideScreenModalBody(mediaFile);
  }

  private renderWideScreenModalBody = (mediaFile: MediaFile) => {
    return (
      <div style={styles.wideScreen.contentContainer}>
        {this.renderMediaFile(mediaFile, false)}
      </div>
    );
  }

  private renderNarrowScreenModalBody = (mediaFile: MediaFile) => { 
      if (this.state.showInfo) {
        return (
          <div style={styles.narrowScreenPictureInfoContainer}>
            <FileInfoComponent {...{mediaFile}} />
          </div>
        );
      }
      return this.renderMediaFile(mediaFile, true);    
  }

  private renderMediaFile = (mediaFile: MediaFile, narrowScreen: boolean) => {
    const previousLink = this.renderPreviousLink();
    const nextLink = this.renderNextLink();

    return (
      <>
        {previousLink}
        {this.renderMediaFileContent(mediaFile)}
        {nextLink}
      </>
    );
  }

  private renderMediaFileContent = (mediaFile: MediaFile) => {
    const {showInfo} = this.state;

    switch (mediaFile.fileType) {
      case MediaFileType.Picture: {
        return <PictureModal pictureMetadata={mediaFile} showInfo={showInfo} />;
      }
      case MediaFileType.Video:
        return <VideoModal {...{mediaFile}} />;
      case MediaFileType.FitTrack: {
        const props = {
          trackSummary: mediaFile,
          ts: Date.now(),
        };
        return <TrackModalContent {...props} />;
      }
      default:
        return <p>Unknown format</p>;
    }
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

  private setPreviousNextData() {
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
}

function mapStateToProps(state: State) {
  return {
    windowSize: state.windowReducer
  };
}

export default compose(
  connect(mapStateToProps)
)(MediaFileModal);
