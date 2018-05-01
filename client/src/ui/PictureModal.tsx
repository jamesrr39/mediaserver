import * as React from 'react';
import { State } from '../reducers';
import { connect, Dispatch } from 'react-redux';
import { PictureMetadata } from '../domain/PictureMetadata';
import { SERVER_BASE_URL } from '../configs';
import { Link } from 'react-router-dom';
import { Action } from 'redux';

const KeyCodes = {
  ESCAPE: 27,
  LEFT_ARROW: 37,
  RIGHT_ARROW: 39,
};

type Props = {
  match: {
    params: {
      hash: string;
    }
  }
  picturesMetadatas: PictureMetadata[],
  dispatch: Dispatch<Action>,
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
  } as React.CSSProperties,
  pictureContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: '100%',
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
};

// type ComponentState = {
//   currentPictureMetadata: PictureMetadata;
//   previousPictureMetadata: PictureMetadata;
//   nextPictureMetadata: PictureMetadata;
// };

class PictureModal extends React.Component<Props> {
  private pictureEl: HTMLImageElement|null;

  private pictureMetadata: PictureMetadata | null = null;
  private previousPictureMetadata: PictureMetadata | null = null;
  private nextPictureMetadata: PictureMetadata | null = null;

  constructor(props: Props) {
    super(props);

  }

  setRenderData() {
    const { picturesMetadatas, match } = this.props;
    let i;

    for (i = 0; i < picturesMetadatas.length; i++) {
      if (picturesMetadatas[i].hashValue === match.params.hash) {
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

  componentDidMount() {
    document.addEventListener('keyup', this.listenToKeyUp);
  }

  componentWillUnmount() {
    document.removeEventListener('keyup', this.listenToKeyUp);
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

      const pictureHeight = (el.clientHeight - 100);
      const pictureWidth = (el.clientWidth - 100);

      const hash = (this.pictureMetadata as PictureMetadata).hashValue;
      const url = `${SERVER_BASE_URL}/picture/${hash}?w=${pictureWidth}&h=${pictureHeight}`;
      this.pictureEl.src = url;
    };

    const previousLink = this.previousPictureMetadata
      ? <Link to={`/picture/${this.previousPictureMetadata.hashValue}`} style={styles.navigationButton}>&larr;</Link>
      : <span style={styles.navigationButton} />;

    const nextLink = this.nextPictureMetadata
      ? <Link to={`/picture/${this.nextPictureMetadata.hashValue}`} style={styles.navigationButton}>&rarr;</Link>
      : <span style={styles.navigationButton} />;

    return (
      <div style={styles.modal} ref={refCb}>
        <Link to="/" style={styles.navigationButton}>&#x274C;</Link>
        <div style={styles.pictureContainer}>
          {previousLink}
          <img src={pictureURL} ref={(el) => {this.pictureEl = el; }} />
          {nextLink}
        </div>
      </div>
    );
  }

  private goBack = () => {
    window.location.hash = '#';
  }

  private goToPrevious = () => {
    if (this.previousPictureMetadata !== null) {
      window.location.hash = `#/picture/${this.previousPictureMetadata.hashValue}`;
    }
  }

  private goToNext = () => {
    if (this.nextPictureMetadata !== null) {
      window.location.hash = `#/picture/${this.nextPictureMetadata.hashValue}`;
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

  // private onDivRefCreated = (el: HTMLDivElement|null) => {
  //   if (el === null || this.pictureEl === null || this.pictureMetadata === null) {
  //     return;
  //   }
  //
  //   const pictureHeight = (el.clientHeight - 100);
  //   const pictureWidth = (el.clientWidth - 20);
  //
  //   const hash = (pictureMetadata as PictureMetadata).hashValue;
  //   const url = `${SERVER_BASE_URL}/picture/${hash}?w=${pictureWidth}&h=${pictureHeight}`;
  //   this.pictureEl.src = url;
  // };
}

function mapStateToProps(state: State) {
  const { picturesMetadatas } = state.picturesMetadatas;

  return {
    picturesMetadatas,
  };
}

export default connect(mapStateToProps)(PictureModal);
