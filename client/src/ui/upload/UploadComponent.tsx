import * as React from 'react';
import { ChangeEvent } from 'react';

import { connect } from 'react-redux';
import { themeStyles } from '../../theme/theme';
import { uploadFile } from '../../actions/mediaFileActions';
import { MediaFile } from '../../domain/MediaFile';

const styles = {
  uploadInput: {
    display: 'none',
  },
};

type Props = {
  uploadFile: (file: File) => Promise<MediaFile>
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
        this.uploadFile(file);
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

  private async uploadFile(file: File) {
    await this.props.uploadFile(file);
  }
}

export default connect(
  undefined,
  {
    uploadFile,
  }
)(UploadComponent);
