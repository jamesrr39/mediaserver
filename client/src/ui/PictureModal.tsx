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

const KeyCodes = {
  ESCAPE: 27,
  LEFT_ARROW: 37,
  RIGHT_ARROW: 39,
};

type Props = {
  hash: string,
  history: History,
  picturesMetadatas: PictureMetadata[],
  dispatch: Dispatch<Action>,
  scrollObservable: Observable,
  baseUrl: string, // for example, /gallery
};

const styles = {
  modal: {
    position: 'fixed',
    height: '100%',
    width: '100%',
    top: 0,
    left: 0,
    backgroundColor: 'black',
    zIndex: 10000,
    color: 'white',
    display: 'flex',
    flexDirection: 'column',
  } as React.CSSProperties,
  pictureContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexGrow: 1,
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
  },
  topBar: {
    position: 'fixed',
    display: 'flex',
    justifyContent: 'space-between',
    width: '100%',
  } as React.CSSProperties,
};

class PictureModal extends React.Component<Props> {
  private pictureEl: HTMLImageElement|null;

  private pictureMetadata: PictureMetadata | null = null;
  private previousPictureMetadata: PictureMetadata | null = null;
  private nextPictureMetadata: PictureMetadata | null = null;

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

    const pictureURL = `${SERVER_BASE_URL}/picture/${this.pictureMetadata.hashValue}`;

    const refCb = (el: HTMLDivElement|null) => {
      if (el === null || this.pictureEl === null) {
        return;
      }

      const pictureMetadata = this.pictureMetadata as PictureMetadata;

      const idealHeight = (el.clientHeight);
      const idealWidth = (el.clientWidth - 100);

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
      this.pictureEl.style.maxHeight = `${idealHeight}px`;
      this.pictureEl.style.maxWidth = `${idealWidth}px`;
      this.pictureEl.src = url;
    };

    const previousLink = this.previousPictureMetadata
      ? (
        <Link
          to={`${this.props.baseUrl}/picture/${this.previousPictureMetadata.hashValue}`}
          style={styles.navigationButton}
        >
          &larr;
        </Link>
      )
      : <span style={styles.navigationButton} />;

    const nextLink = this.nextPictureMetadata
      ? (
        <Link
          to={`${this.props.baseUrl}/picture/${this.nextPictureMetadata.hashValue}`}
          style={styles.navigationButton}
        >
          &rarr;
        </Link>
      )
      : <span style={styles.navigationButton} />;

    const imgStyle = {};

    return (
      <div style={styles.modal} ref={refCb}>
        <div style={styles.topBar}>
          <Link to={this.props.baseUrl} style={styles.navigationButton}>&#x274C;</Link>
          <a
            href={pictureURL}
            download={encodeURIComponent(this.pictureMetadata.getName())}
            style={styles.navigationButton}
            className="fa fa-download"
            aria-label="Download"
          />
        </div>
        <div style={styles.pictureContainer}>
          <div>{previousLink}</div>
          <div>
            <img src={pictureURL} style={imgStyle} ref={(el) => {this.pictureEl = el; }} />
          </div>
          <div>{nextLink}</div>
        </div>
      </div>
    );
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
