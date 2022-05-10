import * as React from "react";
import { themeStyles } from "../../theme/theme";
import { useState } from "react";
import PopupModal from "../modals/PopupModal";

const styles = {
  nameInput: {
    padding: "10px",
    borderRadius: "10px",
    width: "300px",
    margin: "0 10px",
    border: "1px dashed black",
  },
  container: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    height: "100%",
  } as React.CSSProperties,
  buttonContainer: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    margin: "20px",
  } as React.CSSProperties,
  uploadInput: {
    display: "none",
  },
};

type Props = {
  onSubmit: (name: string) => void;
  onCancel: () => void;
};

export default function AddCollectionModal(props: Props) {
  const [name, setName] = useState("");
  const refCb = (element: HTMLElement | null) => {
    if (!element) {
      return;
    }
    element.focus();
  };

  return (
    <PopupModal>
      <div style={styles.container}>
        <form>
          <input
            type="text"
            placeholder="name"
            style={styles.nameInput}
            value={name}
            onChange={(event) => {
              const newName = event.target.value;
              setName(newName);
            }}
            ref={refCb}
          />
          <div style={styles.buttonContainer}>
            <button
              type="submit"
              onClick={() => props.onSubmit(name)}
              style={themeStyles.button}
            >
              Save
            </button>
            <button
              type="button"
              onClick={props.onCancel}
              style={themeStyles.button}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </PopupModal>
  );
}
