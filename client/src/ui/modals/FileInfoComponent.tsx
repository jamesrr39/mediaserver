import * as React from "react";
import { SMALL_SCREEN_WIDTH } from "../../util/screen_size";
import MapComponent, { newDivIcon } from "../MapComponent";
import { MediaFile } from "../../domain/MediaFile";
import { styles as TopBarStyles } from "./ModalTopBar";
import PartipantsComponent from "./ParticipantsComponent";

export const INFO_CONTAINER_WIDTH = SMALL_SCREEN_WIDTH;

const styles = {
  container: {
    backgroundColor: "#333",
    padding: "40px 10px 0",
    height: "100%",
  },
};

const mapContainerSize = {
  width: `${INFO_CONTAINER_WIDTH}px`,
  height: `${INFO_CONTAINER_WIDTH}px`,
};

type Props = {
  mediaFile: MediaFile;
  onCloseButtonClicked?: () => void;
};

class FileInfoComponent extends React.Component<Props> {
  render() {
    const { mediaFile, onCloseButtonClicked } = this.props;

    const dateTaken = mediaFile.getTimeTaken();
    const timeTakenText = dateTaken ? dateTaken.toUTCString() : "Unknown Date";
    let location = mediaFile.getLocation();
    let icon = undefined;
    if (location === null && mediaFile.suggestedLocation) {
      location = mediaFile.suggestedLocation;
      icon = newDivIcon();
    }
    const mapContainer =
      location !== null ? (
        <MapComponent
          {...{
            size: mapContainerSize,
            markers: [{ location, icon }],
            zoomControl: true,
          }}
        />
      ) : (
        <p>No Location Data available</p>
      );

    const { reason } = mediaFile?.suggestedLocation || {};

    return (
      <div style={styles.container}>
        {onCloseButtonClicked && (
          <div style={TopBarStyles.topBar}>
            <button
              onClick={onCloseButtonClicked}
              style={TopBarStyles.navigationButton}
              className="fa fa-info-circle"
              aria-label="Info"
            />
          </div>
        )}
        <p>{mediaFile.getName()}</p>
        <p>{timeTakenText}</p>
        <div>
          <PartipantsComponent mediaFile={mediaFile} />
        </div>
        {mapContainer}
        {reason}
      </div>
    );
  }
}

export default FileInfoComponent;
