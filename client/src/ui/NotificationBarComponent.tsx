import * as React from "react";
import { connect } from "react-redux";
import { Dispatch } from "redux";
import { State } from "../reducers/rootReducer";
import { Action } from "redux";
import { removeNotification } from "../actions/notificationActions";

export enum NotificationLevel {
  INFO,
  ERROR,
}

export class GalleryNotification {
  constructor(
    public readonly level: NotificationLevel,
    public readonly text: string
  ) {}
}

type Props = {
  notifications: GalleryNotification[];
  dispatch: Dispatch<Action>;
};

const baseStyles = {
  notification: {
    backgroundColor: "white",
    padding: "15px",
    borderStyle: "solid",
    borderWidth: "3px",
  },
};

const styles = {
  infoNotification: {
    ...baseStyles.notification,
    borderColor: "#41ba6f",
    backgroundColor: "lightgreen",
  },
  errorNotification: {
    ...baseStyles.notification,
    borderColor: "red",
    backgroundColor: "#d16d60",
  },
  closeNotificationButton: {
    background: "none",
    border: "1px black solid",
    cursor: "pointer",
  },
};

class NotificationBar extends React.Component<Props> {
  removeNotification = (notification: GalleryNotification) => {
    this.props.dispatch(removeNotification(notification));
  };

  render() {
    const notificationContainers = this.props.notifications.map(
      (notification, index) => {
        const notificationStyle =
          notification.level === NotificationLevel.INFO
            ? styles.infoNotification
            : styles.errorNotification;
        return (
          <div key={index} style={notificationStyle}>
            {notification.text}&nbsp;
            <button
              type="button"
              style={styles.closeNotificationButton}
              onClick={() => this.removeNotification(notification)}
              aria-label="close"
            >
              &times;
            </button>
          </div>
        );
      }
    );

    return <div>{notificationContainers}</div>;
  }
}

function mapStateToProps(state: State) {
  return {
    notifications: state.notificationsReducer.notifications,
  };
}

export default connect(mapStateToProps)(NotificationBar);
