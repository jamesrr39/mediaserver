import * as React from "react";
import { Link } from "react-router-dom";
import { themeStyles } from "src/theme/theme";

type Props = {
  child?: React.ReactNode;
};

const styles = {
  container: {
    ...themeStyles.topBar,
    padding: "15px 10px 10px",
  },
  linkContainer: {
    padding: "10px",
  },
};

export default class MediaserverTopBar extends React.Component<Props> {
  render() {
    const child = this.props.child || "";

    return (
      <div style={styles.container}>
        <Link to="/map" style={styles.linkContainer}>
          Map
        </Link>
        <Link to="/gallery" style={styles.linkContainer}>
          Gallery
        </Link>
        <Link to="/collections" style={styles.linkContainer}>
          Collections
        </Link>
        {child}
      </div>
    );
  }
}
