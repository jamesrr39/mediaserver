import React from "react";

const styles = {
  outer: {
    position: "fixed" as "fixed",
    // height: "100%",
    width: "100%",
    top: 0,
    left: 0,
    zIndex: 10001,
    display: "flex",
    overflowY: "scroll" as "scroll",
    justifyContent: "center",
  },
  inner: {
    backgroundColor: "white",
    minWidth: "300px",
    width: "60%",
    padding: "20px",
    borderRadius: "10px",
    margin: "10px",
  },
  mask: {
    position: "fixed" as "fixed",
    height: "100%",
    width: "100%",
    top: 0,
    left: 0,
    backgroundColor: "grey",
    zIndex: 10000,
    color: "white",
    // display: 'flex',
    // flexDirection: 'column' as 'column',
    overflowY: "scroll" as "scroll",
    opacity: 0.9,
  },
  closeButton: {
    textDecoration: "none",
    float: "right" as "right",
  },
};

type Props = {
  onClickClose: () => void;
  children: React.ReactNode | React.ReactNode[];
};

export default function PopupModal(props: Props) {
  return (
    <>
      <div style={styles.mask} onClick={() => props.onClickClose()}></div>
      <div style={styles.outer}>
        <div style={styles.inner}>
          <a
            href="#"
            aria-label="Close Popup"
            onClick={(e) => {
              e.preventDefault();
              props.onClickClose();
            }}
            style={styles.closeButton}
          >
            ×
          </a>
          {props.children}
        </div>
      </div>
    </>
  );
}
