import * as React from "react";
import { useMutation } from "react-query";
import { useDispatch, useSelector } from "react-redux";
import { OnChangeValue } from "react-select";
import CreateableSelect from "react-select/creatable";
import { createPerson } from "src/actions/peopleActions";
import {
  PeopleMap,
  setParticipantsOnMediaFile,
} from "../../actions/mediaFileActions";
import { MediaFile } from "../../domain/MediaFile";
import { Person } from "../../domain/People";
import { State } from "../../reducers/rootReducer";

type Option = {
  value: string;
  label: string;
};

function useChoosePersonMutation(mediaFile: MediaFile) {
  const dispatch = useDispatch();

  const state = useSelector((state: State) => state);
  const { peopleMap } = state.peopleReducer;

  return useMutation(async (selectedItems: OnChangeValue<Option, true>) => {
    const people: Person[] = [];
    for (let selected of selectedItems) {
      const id = parseInt(selected.value, 10);

      let person = peopleMap.get(id);
      if (!person) {
        person = await createPerson(selected.label)(dispatch, () => state);
      }

      people.push(person);
    }

    setParticipantsOnMediaFile(mediaFile, people)(dispatch, () => state);
  });
}

const styles = {
  selectStyles: {
    color: "black",
  },
  container: {
    padding: "10px",
  },
};

type Props = {
  mediaFile: MediaFile;
};

function PartipantsComponent(props: Props) {
  const { mediaFile } = props;
  const { people } = useSelector((state: State) => state.peopleReducer);
  const [editing, setEditing] = React.useState(false);

  const peopleInFile = people
    .filter((person) => mediaFile.participantIds.indexOf(person.id) !== -1)
    .map((person) => ({
      value: person.id + "",
      label: person.name,
    }));

  const allPeople = people.map((person) => ({
    value: person.id + "",
    label: person.name,
  }));

  const choosePersonMutation = useChoosePersonMutation(mediaFile);

  const onChange = (newValue: OnChangeValue<Option, true>) => {
    return choosePersonMutation.mutate(newValue);
  };

  const [selection, setSelection] = React.useState(
    [] as OnChangeValue<Option, true>
  );

  return (
    <div className="border border-white rounded" style={styles.container}>
      <label>Who was here?</label>
      <span style={styles.selectStyles}>
        <CreateableSelect
          isDisabled={!editing}
          styles={{
            option: (provided, state) => ({
              ...provided,
              backgroundColor: "lightgrey",
            }),
            control: (provided) => ({
              ...provided,
              backgroundColor: "transparent",
            }),
          }}
          isMulti={true}
          onChange={(newValue: OnChangeValue<Option, true>) =>
            setSelection(newValue)
          }
          defaultValue={peopleInFile}
          options={allPeople as unknown as undefined}
        />
      </span>

      <button
        className="btn btn-secondary"
        onClick={() => {
          setEditing(!editing);
          onChange(selection);
        }}
      >
        {editing && <i className="fa fa-check"></i>}
        {!editing && <i className="fa fa-pencil"></i>}
      </button>
    </div>
  );
}

export default PartipantsComponent;
