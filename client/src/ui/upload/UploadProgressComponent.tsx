import * as React from 'react';

import { connect } from 'react-redux';
import { compose } from 'redux';
import { FileQueue } from '../../fileQueue';
import { State } from '../../reducers/fileReducer';

type Props = {
  uploadQueue: FileQueue;
};

const styles = {
  container: {
    backgroundColor: '#eee',
    padding: '20px',
    border: '1px solid #222',
    minWidth: '120px',
  },
};

class UploadProgressComponent extends React.Component<Props> {
  render() {
    const {uploadQueue} = this.props;
    const status = uploadQueue.getStatus();

    if (status.queued.length === 0 && status.currentlyUploading.length === 0 && status.finished.length === 0) {
      return null;
    }

    return (
      <div style={styles.container}>
        Upload:
        <p>{status.finished.length} finished</p>
        <p>{status.currentlyUploading.length} in progress</p>
        <p>{status.queued.length} queued</p>
      </div>
    );
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
)(UploadProgressComponent);
