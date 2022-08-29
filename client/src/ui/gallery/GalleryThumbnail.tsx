import { useContext, useState } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { PeopleMap } from "src/actions/mediaFileActions";
import { BuildLinkContext } from "src/context/BuildLinkContext";
import { MediaFile } from "src/domain/MediaFile";
import { Size } from "src/domain/Size";
import { State } from "src/reducers/rootReducer";
import Thumbnail from "../Thumbnail";

export type SelectThumbnailEventInfo = {
  selected: boolean;
};

const styles = {
  participantListWrapper: {
    padding: 0,
    listStyle: "none",
  },
};

type Props = {
  mediaFile: MediaFile;
  size: Size;

  peopleMap: PeopleMap;
  onClickThumbnail?: (mediaFile: MediaFile) => void;
  onSelectThumbnail?: (
    mediaFile: MediaFile,
    eventInfo: SelectThumbnailEventInfo
  ) => void;
  isThumbnailVisible(el: HTMLElement): boolean;
};

function GalleryThumbnail(props: Props) {
  const [checked, setChecked] = useState(false);
  const peopleMap = useSelector(
    (state: State) => state.peopleReducer.peopleMap
  );

  const {
    mediaFile,
    size,
    onClickThumbnail,
    onSelectThumbnail,
    isThumbnailVisible,
  } = props;

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

  if (onClickThumbnail) {
    const onClickThumbnailCb = (event: React.MouseEvent<HTMLAnchorElement>) => {
      event.preventDefault();
      onClickThumbnail(mediaFile);
    };

    thumbnail = (
      <a href="#" onClick={onClickThumbnailCb}>
        {thumbnail}
      </a>
    );
  }

  const checkbox = onSelectThumbnail ? (
    <div className="form-check">
      <input
        type="checkbox"
        className="form-check-input"
        onChange={(event) => {
          const { checked } = event.target;
          setChecked(checked);
          onSelectThumbnail(mediaFile, { selected: checked });
        }}
        style={{
          padding: "10px",
          // position: "absolute",
          // opacity: 0,
          // cursor: "pointer",
          // height: 0,
          // width: 0,
        }}
      />
      <label
        className="form-check-label"
        style={
          {
            // position: "absolute",
            // top: 0,
            // left: 0,
            // height: "25px",
            // width: "25px",
            // backgroundColor: "#eee",
          }
        }
      ></label>
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
