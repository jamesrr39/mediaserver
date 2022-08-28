import React from "react";
import { WindowContext } from "src/context/WindowContext";
import GalleryThumbnail from "./GalleryThumbnail";
import {
  GALLERY_FILE_LEFT_MARGIN_PX,
  GroupWithSizes,
  MediaFileWithSize,
  Row,
} from "./GalleryUtil";

type Props = {
  row: Row;
  group: GroupWithSizes;
};

function ThumbnailGroup(props: Props) {
  const { row, group } = props;

  if (row.fitsInOneLine) {
    const rowsJSX = group.mediaFiles.map((mediaFileWithSize, index) => {
      const { mediaFile, size } = mediaFileWithSize;

      const leftPx = index === 0 ? 0 : GALLERY_FILE_LEFT_MARGIN_PX;
      const style = {
        marginLeft: `${leftPx}px`,
      };

      return (
        <div key={index} style={style}>
          <GalleryThumbnail mediaFile={mediaFile} size={size} {...this.props} />
        </div>
      );
    });

    return <div style={{ display: "flex" }}>{rowsJSX}</div>;
  }

  let distanceThroughContainer = 0;
  const rows: MediaFileWithSize[][] = [];
  let currentRow: MediaFileWithSize[] = [];

  const windowContext = React.useContext(WindowContext);
  const rowWidth = windowContext.innerWidth;

  group.mediaFiles.forEach((mediaFileWithSize, index) => {
    const { size } = mediaFileWithSize;

    if (distanceThroughContainer + size.width > rowWidth) {
      rows.push(currentRow);
      currentRow = [mediaFileWithSize];
      distanceThroughContainer = size.width;
    } else {
      const leftPx = index === 0 ? 0 : GALLERY_FILE_LEFT_MARGIN_PX;
      distanceThroughContainer += size.width + leftPx;
      currentRow.push(mediaFileWithSize);
    }
  });

  if (currentRow.length !== 0) {
    rows.push(currentRow);
  }

  const rowsJSX = rows.map((row, index) => {
    const rowThumbnails = row.map((mediaFileWithSize, index) => {
      const { mediaFile, size } = mediaFileWithSize;

      const leftPx = index === 0 ? 0 : GALLERY_FILE_LEFT_MARGIN_PX;

      const style = {
        marginLeft: `${leftPx}px`,
      };

      return (
        <div key={index} style={style}>
          <GalleryThumbnail mediaFile={mediaFile} size={size} {...this.props} />
        </div>
      );
    });

    const style = {
      display: "flex",
      marginTop: index === 0 ? 0 : "10px",
    };

    return (
      <div key={index} style={style}>
        {rowThumbnails}
      </div>
    );
  });

  return <>{rowsJSX}</>;
}

export default ThumbnailGroup;
