import * as React from 'react';
import { ChangeEvent } from 'react';
import Modal from '../Modal';
import { themeStyles } from '../../theme/theme';

const styles = {
  nameInput: {
    padding: '10px',
    borderRadius: '10px',
    width: '300px',
    margin: '0 10px',
    border: '1px dashed black',
  },
  container: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
  } as React.CSSProperties,
  buttonContainer: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    margin: '20px',
  } as React.CSSProperties,
  uploadInput: {
    display: 'none',
  },
};

type Props = {
  onSubmit: (name: string) => void;
  onCancel: () => void;
};

type ComponentState = {
  name: string;
};

export default class AddCollectionModal extends React.Component<Props, ComponentState> {
  state = {
    name: '',
  };

  render() {
    const refCb = (element: HTMLElement|null) => {
      if (!element) {
        return;
      }
      element.focus();
    };

    return (
      <Modal>
        <div style={styles.container}>
          <form>
            <input
              type="text"
              placeholder="name"
              style={styles.nameInput}
              value={this.state.name}
              onChange={event => this.onNameChange(event)}
              ref={refCb}
            />
            <div style={styles.buttonContainer}>
              <button
                type="submit"
                onClick={() => this.props.onSubmit(this.state.name)}
                style={themeStyles.button}
              >
                Save
              </button>
              <button type="button" onClick={this.props.onCancel} style={themeStyles.button}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      </Modal>
    );
  }

  private onNameChange = (event: ChangeEvent<HTMLInputElement>) => {
    const name = event.target.value;
    this.setState(state => ({
        ...state,
        name,
    }));
  }
}
