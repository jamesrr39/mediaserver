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

type Props = {
  children: React.ReactNode | React.ReactNode[];
};

export default function FullScreenModal(props: Props) {
  return <div style={styles.modal}>{props.children}</div>;
}
