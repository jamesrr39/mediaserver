import { MediaFile } from "src/domain/MediaFile";
import { MediaFileType } from "src/domain/MediaFileType";
import NavigationArrow from "./arrows/NavigationArrow";
import PictureModal from "./PictureModal";
import TrackModalContent from "./track_modal/TrackModalContent";
import VideoModal from "./VideoModal";

const styles = {
  contentContainer: {
    height: "100%",
    flexGrow: 1,
    display: "flex" as "flex",
    justifyContent: "space-between",
  },
};

type Props = {
  baseUrl: string;
  showInfo: boolean;
  mediaFile: MediaFile;
  previousMediaFile: MediaFile;
  nextMediaFile: MediaFile;
};

type ContentProps = {
  showInfo: boolean;
  mediaFile: MediaFile;
};

function Content(props: ContentProps) {
  const { mediaFile, showInfo } = props;
  switch (mediaFile.fileType) {
    case MediaFileType.Picture: {
      return <PictureModal pictureMetadata={mediaFile} showInfo={showInfo} />;
    }
    case MediaFileType.Video:
      return <VideoModal {...{ mediaFile }} />;
    case MediaFileType.FitTrack: {
      return <TrackModalContent trackSummary={mediaFile} />;
    }
    default:
      return <p>Unknown format</p>;
  }
}

export default function WideScreenModal(props: Props) {
  const { showInfo, mediaFile, previousMediaFile, nextMediaFile, baseUrl } =
    props;

  return (
    <div style={styles.contentContainer}>
      {previousMediaFile && (
        <NavigationArrow
          direction="back"
          ariaLabel="previous"
          linkUrl={`${baseUrl}/detail/${previousMediaFile.hashValue}`}
        />
      )}
      <Content mediaFile={mediaFile} showInfo={showInfo} />
      {nextMediaFile && (
        <NavigationArrow
          direction="forwards"
          ariaLabel="next"
          linkUrl={`${baseUrl}/detail/${nextMediaFile.hashValue}`}
        />
      )}
    </div>
  );
}
