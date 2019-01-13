import * as React from 'react';
import { ChangeEvent } from 'react';

import { connect } from 'react-redux';
import { Action, Dispatch } from 'redux';
import { compose } from 'redux';
import { themeStyles } from '../theme/theme';
import { State } from '../reducers';
import { FileQueue } from '../fileQueue';
import { newNotificationAction } from '../actions/notificationActions';
import { GalleryNotification, NotificationLevel } from './NotificationBarComponent';

const styles = {
  uploadInput: {
    display: 'none',
  },
};

type Props = {
  dispatch: Dispatch<Action>;
  uploadQueue: FileQueue;
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
    const { uploadQueue, dispatch } = this.props;
    
    try {
      const mediaFile = await uploadQueue.uploadOrQueue(file);
      dispatch(
        newNotificationAction(
          new GalleryNotification(NotificationLevel.INFO, `uploaded ${mediaFile.getName()}`)
        )
      );
    } catch (error) {
      dispatch(
        newNotificationAction(
          new GalleryNotification(NotificationLevel.ERROR, `failed to upload ${file.name}. Error: ${error}`)
        )
      );
    }
  }
}

function mapStateToProps(state: State) {
  const { uploadQueue } = state.mediaFilesReducer;
  return {
    uploadQueue,
  };
}

export default compose(
  connect(mapStateToProps),
)(UploadComponent);
