import * as React from 'react';
import { connect, Dispatch } from 'react-redux';
import { State } from '../reducers';
import { removeNotification } from '../actions';
import { Action } from 'redux';

export type GalleryNotification = {
  text: string,
  level: 'info' | 'error'
};

type Props = {
  notifications: GalleryNotification[]
  dispatch: Dispatch<Action>;
};

const baseStyles = {
  notification: {
    backgroundColor: 'white',
    padding: '15px',
    borderStyle: 'solid',
    borderWidth: '3px',
  },
};

const styles = {
  infoNotification: {
    ...baseStyles.notification,
    borderColor: 'lightgreen',
  },
  errorNotification: {
    ...baseStyles.notification,
    borderColor: 'red',
  }
};

class NotificationBar extends React.Component<Props> {
  removeNotification = (notification: GalleryNotification) => {
    this.props.dispatch(removeNotification(notification));
  }

  render() {
    const notificationContainers = this.props.notifications.map((notification, index) => {
      const notificationStyle = (notification.level === 'info') ? styles.infoNotification : styles.errorNotification;
      return (
        <div key={index} style={notificationStyle}>
          {notification.text}
          <button onClick={() => this.removeNotification(notification)} aria-label="close">X</button>
        </div>
      );
    });

    return (
      <div>
        {notificationContainers}
      </div>
    );
  }
}

function mapStateToProps(state: State) {
  return {
    notifications: state.picturesMetadatas.notifications,
  };
}

export default connect(mapStateToProps)(NotificationBar);
