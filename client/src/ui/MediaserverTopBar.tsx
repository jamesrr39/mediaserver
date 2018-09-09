import * as React from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { withRouter } from 'react-router-dom';
import { compose } from 'redux';

type Props = {
  child?: React.ReactNode;
};

const styles = {
  container: {
    padding: '15px 10px 10px',
    height: '30px',
    backgroundColor: '#eee',
  },
  linkContainer: {
    padding: '10px',
  }
};

class MediaserverTopBar extends React.Component<Props> {
  render() {
    const child = this.props.child || '';

    return (
      <div style={styles.container}>
        <Link to="/gallery" style={styles.linkContainer}>Gallery</Link>
        <Link to="/collections" style={styles.linkContainer}>Collections</Link>
        {child}
      </div>
    );
  }
}

export default compose(
  withRouter,
  connect((state) => (state)),
)(MediaserverTopBar);
