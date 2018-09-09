import * as React from 'react';
import { ChangeEvent } from 'react';
import { queueFileForUpload } from '../actions';

import { connect, Dispatch } from 'react-redux';
import { Action } from 'redux';
import { compose } from 'redux';
import { themeStyles } from '../theme/theme';

const styles = {
  uploadInput: {
    display: 'none',
  },
};

type Props = {
  dispatch: Dispatch<Action>;
};

type ComponentState = {
  isUploadingEnabled: boolean;
};

class UploadComponent extends React.Component<Props, ComponentState> {
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
        this.props.dispatch(queueFileForUpload(file));
    }
  }

  render() {
    return (
      <label style={themeStyles.button}>
        Upload
        <input style={styles.uploadInput} type="file" multiple={true} onChange={this.onFileUploadSelected} />
      </label>
    );
  }
}

export default compose(
  connect((state) => (state)),
)(UploadComponent);
