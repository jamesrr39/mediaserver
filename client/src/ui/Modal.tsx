import * as React from "react";

const styles = {
  modal: {
    position: "fixed" as "fixed",
    height: "100%",
    width: "100%",
    top: 0,
    left: 0,
    backgroundColor: "black",
    zIndex: 10000,
    color: "white",
    // display: 'flex',
    // flexDirection: 'column' as 'column',
    overflowY: "scroll" as "scroll",
  },
};

export default class Modal extends React.Component {
  render() {
    return <div style={styles.modal}>{this.props.children}</div>;
  }
}
