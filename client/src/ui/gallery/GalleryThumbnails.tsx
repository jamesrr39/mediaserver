import GalleryRow from "./GalleryRow";
import { Row } from "./GalleryUtil";

type Props = {
  rows: Row[];
  lastIndexShown: number;
  isThumbnailVisible(el: HTMLElement): void;
};

export const ROWS_IN_INCREMENT = 10;

function GalleryThumbnails(props: Props) {
  const { rows, lastIndexShown, isThumbnailVisible } = props;

  const rowsHtml = rows
    .map((row, index) => {
      if (index > lastIndexShown + ROWS_IN_INCREMENT) {
        // don't render anything below the cut
        return null;
      }

      return (
        <GalleryRow
          key={index}
          row={row}
          isThumbnailVisible={isThumbnailVisible}
        />
      );
    })
    .filter((rowHtml) => Boolean(rowHtml));

  return <div>{rowsHtml}</div>;
}

export default GalleryThumbnails;
