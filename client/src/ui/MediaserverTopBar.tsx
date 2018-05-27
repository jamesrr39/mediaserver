import * as React from 'react';
import { connect, Dispatch } from 'react-redux';
import { ChangeEvent } from 'react';
import { uploadFile } from '../actions';
import { Action } from 'redux';
import { Link } from 'react-router-dom';
import { withRouter } from 'react-router-dom';
import { compose } from 'redux';

type ComponentState = {
  isUploadingEnabled: boolean;
};

type Props = {
  dispatch: Dispatch<Action>;
};

const styles = {
  customFileUpload: {
    border: '1px solid #ccc',
    display: 'inline-block',
    padding: '6px 12px',
    cursor: 'pointer',
  },
  uploadInput: {
    display: 'none',
  },
  container: {
    margin: '10px'
  }
};

class MediaserverTopBar extends React.Component<Props, ComponentState> {
  state = {
    isUploadingEnabled: true
  };

  onFileUploadSelected = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files === null) {
      return;
    }
    this.setState(state => {
      return {
        isUploadingEnabled: false,
        ...state,
      };
    });
    for (let i = 0; i < event.target.files.length; i++) {
        const file = event.target.files[i];
        this.props.dispatch(uploadFile(file));
    }
  }

  render() {
    return (
      <div style={styles.container}>
        <Link to="/gallery">Gallery</Link>
        <label style={styles.customFileUpload}>
          Upload
          <input style={styles.uploadInput} type="file" multiple={true} onChange={this.onFileUploadSelected} />
        </label>
      </div>
    );
  }
}

export default compose(
  withRouter,
  connect((state) => (state)),
)(MediaserverTopBar);
