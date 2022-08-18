import * as React from "react";
import { MediaFile } from "../../domain/MediaFile";
import Thumbnail, { getSizeForThumbnail } from "../Thumbnail";
import { Size } from "../../domain/Size";
import { MediaFileGroup } from "../../domain/MediaFileGroup";
import { Link } from "react-router-dom";
import { Observable } from "ts-util/dist/Observable";
import { PeopleMap } from "../../actions/mediaFileActions";
import GalleryThumbnail, {
  BuildLinkFunc,
  SelectThumbnailEventInfo,
} from "./GalleryThumbnail";
import { connect } from "react-redux";
import { getScreenWidth } from "src/util/screen_size";
import { State } from "src/reducers/rootReducer";

export type Row = {
  groups: GroupWithSizes[];
  fitsInOneLine: boolean;
};

export const GALLERY_GROUP_LEFT_MARGIN_PX = 50;

export const GALLERY_FILE_LEFT_MARGIN_PX = 10;

const styles = {
  row: {
    display: "flex",
    padding: "10px",
    margin: "10px",
  },
};

type MediaFileWithSize = {
  mediaFile: MediaFile;
  size: Size;
};

interface GroupWithSizes {
  name: string;
  mediaFiles: MediaFileWithSize[];
  value: number; // higher = sorted first
}

type Props = {
  row: Row;
  peopleMap: PeopleMap;
  // scrollObservable: Observable<void>;
  // resizeObservable: Observable<void>;
  onClickThumbnail?: (mediaFile: MediaFile) => void;
  buildLink?: BuildLinkFunc;
  onSelectThumbnail?: (
    mediaFile: MediaFile,
    eventInfo: SelectThumbnailEventInfo
  ) => void;
  rowWidth: number;
  isThumbnailVisible(el: HTMLElement): void;
};

class GalleryRow extends React.Component<Props> {
  render() {
    const { row } = this.props;

    const { groups } = row;

    return (
      <div style={styles.row}>
        {groups.map((group, index) => {
          const style: React.CSSProperties = {};
          if (index !== 0) {
            style.marginLeft = `${GALLERY_GROUP_LEFT_MARGIN_PX}px`;
          }
          return (
            <div key={index} style={style}>
              <h4>{group.name}</h4>
              <div>{this.renderGroup(group)}</div>
            </div>
          );
        })}
      </div>
    );
  }

  private renderGroup(group: GroupWithSizes) {
    const { rowWidth, row } = this.props;

    if (row.fitsInOneLine) {
      return group.mediaFiles.map((mediaFileWithSize, index) => {
        const { mediaFile, size } = mediaFileWithSize;

        const leftPx = index === 0 ? 0 : GALLERY_FILE_LEFT_MARGIN_PX;
        const style = {
          marginLeft: `${leftPx}px`,
        };

        return (
          <div key={index} style={style}>
            <GalleryThumbnail
              mediaFile={mediaFile}
              size={size}
              {...this.props}
            />
          </div>
        );
      });
    }

    let distanceThroughContainer = 0;
    const rows: MediaFileWithSize[][] = [];
    let currentRow: MediaFileWithSize[] = [];

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

    return rows.map((row, index) => {
      const rowThumbnails = row.map((mediaFileWithSize, index) => {
        const { mediaFile, size } = mediaFileWithSize;

        const leftPx = index === 0 ? 0 : GALLERY_FILE_LEFT_MARGIN_PX;

        const style = {
          marginLeft: `${leftPx}px`,
        };

        return (
          <div key={index} style={style}>
            <GalleryThumbnail
              mediaFile={mediaFile}
              size={size}
              {...this.props}
            />
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
  }
}

export default connect((state: State) => {
  return { rowWidth: state.windowReducer.innerWidth };
})(GalleryRow);

export function filesToRows(
  rowSizePx: number,
  mediaFileGroups: MediaFileGroup[]
): Row[] {
  const rows: Row[] = [];
  let currentRow: GroupWithSizes[] = [];
  let widthSoFar = 0;
  const reduceFunc = (prev: number, curr: MediaFileWithSize, index: number) => {
    const leftMargin = index === 0 ? 0 : GALLERY_FILE_LEFT_MARGIN_PX;
    return prev + curr.size.width + leftMargin;
  };
  const groupSortingFunc = (a: GroupWithSizes, b: GroupWithSizes) => {
    return a.value < b.value ? 1 : -1;
  };

  mediaFileGroups.forEach((group) => {
    const thumbnails = group.mediaFiles.map((mediaFile) => ({
      size: getSizeForThumbnail(mediaFile),
      mediaFile,
    }));

    const groupWidth = thumbnails.reduce(reduceFunc, 0);
    let groupWidthWithMargin = groupWidth;
    if (widthSoFar !== 0) {
      groupWidthWithMargin += GALLERY_GROUP_LEFT_MARGIN_PX;
    }

    const thumbnailGroup = {
      mediaFiles: thumbnails,
      name: group.name,
      value: group.value,
    };

    const shouldBeInNewRow = groupWidthWithMargin + widthSoFar >= rowSizePx;

    if (shouldBeInNewRow) {
      // group can't fit in this row
      widthSoFar = 0;

      currentRow.sort(groupSortingFunc);
      rows.push({ groups: currentRow, fitsInOneLine: false });

      currentRow = [];
      if (groupWidth >= rowSizePx) {
        // group is as wide or wider than a row
        const fitsInOneLine = groupWidth === rowSizePx;
        rows.push({ groups: [thumbnailGroup], fitsInOneLine });
      } else {
        currentRow.push(thumbnailGroup);
        widthSoFar = groupWidth;
      }
      return;
    }

    // add to existing row
    widthSoFar += groupWidthWithMargin;
    currentRow.push(thumbnailGroup);
  });

  if (currentRow.length !== 0) {
    rows.push({ groups: currentRow, fitsInOneLine: true });
  }

  return rows;
}
