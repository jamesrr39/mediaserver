import { useContext, useState } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { PeopleMap } from "src/actions/mediaFileActions";
import { BuildLinkContext } from "src/context/BuildLinkContext";
import { SelectThumbnailContext } from "src/context/SelectThumbnailContext";
import { MediaFile } from "src/domain/MediaFile";
import { Size } from "src/domain/Size";
import { State } from "src/reducers/rootReducer";
import Thumbnail from "../Thumbnail";

const styles = {
  participantListWrapper: {
    padding: 0,
    listStyle: "none",
  },
  checkbox: {
    padding: "10px",
  },
};

type Props = {
  mediaFile: MediaFile;
  size: Size;
  isThumbnailVisible(el: HTMLElement): boolean;
};

function GalleryThumbnail(props: Props) {
  const [checked, setChecked] = useState(false);
  const { peopleMap } = useSelector((state: State) => state.peopleReducer);

  const { mediaFile, size, isThumbnailVisible } = props;

  let thumbnail = (
    <Thumbnail
      size={size}
      mediaFile={mediaFile}
      isThumbnailVisible={isThumbnailVisible}
    />
  );

  const buildLink = useContext(BuildLinkContext);

  if (buildLink) {
    thumbnail = <Link to={buildLink(mediaFile)}>{thumbnail}</Link>;
  }

  const onSelectThumbnail = useContext(SelectThumbnailContext);

  const checkbox = onSelectThumbnail ? (
    <div className="form-check">
      <input
        type="checkbox"
        className="form-check-input"
        onChange={(event) => {
          const { checked } = event.target;
          setChecked(checked);
          onSelectThumbnail(mediaFile, checked);
        }}
        style={styles.checkbox}
      />
      <label className="form-check-label"></label>
    </div>
  ) : null;

  return (
    <>
      <div className="gallery-thumbnail">
        <div
          className={`gallery-checkbox ${checked ? " checked" : ""}`}
          style={checked ? { display: "block" } : null}
        >
          {checkbox}
        </div>
        {thumbnail}
      </div>
      {mediaFile.participantIds.length !== 0 && (
        <ul style={styles.participantListWrapper}>
          {mediaFile.participantIds.map((partipantId, idx) => {
            const person = peopleMap.get(partipantId);

            return (
              <li key={idx}>
                <i className="fa fa-user" aria-hidden="true"></i>
                &nbsp;{person ? person.name : "(unknown)"}
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}

export default GalleryThumbnail;
