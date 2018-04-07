
import * as React from 'react';

type Props = {
  match: {
    params: {
      hash: string;
    }
  }
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
};

export class PictureModal extends React.Component<Props> {
  render() {
    return (
      <div style={styles.modal}>
        <div>Modal Body 2 ({this.props.match.params.hash})</div>
      </div>
    );
  }
}
