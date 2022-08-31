import * as React from "react";
import { MediaFile } from "../../domain/MediaFile";
import { isNarrowScreen } from "../../util/screen_size";
import FullScreenModal from "../FullScreenModal";
import FileInfoComponent from "./FileInfoComponent";
import ModalTopBar from "./ModalTopBar";
import WideScreenModal from "./WideScreenModal";

// https://developer.mozilla.org/en-US/docs/Web/API/UI_Events/Keyboard_event_key_values
const KeyCodes = {
  ESCAPE: "Escape",
  LEFT_ARROW: "ArrowLeft",
  RIGHT_ARROW: "ArrowRight",
};

enum Subview {
  INFO = "info",
}

const styles = {
  narrowScreenPictureInfoContainer: {
    backgroundColor: "#333",
    height: "100%",
    padding: "40px 10px 0",
    flex: `0 1 auto`,
    width: "100%",
  },
  narrowScreenContentContainer: {
    width: "auto",
  },

  wideScreen: {
    contentContainer: {
      height: "100%",
      flexGrow: 1,
      display: "flex" as "flex",
      // alignItems: 'center',
      justifyContent: "space-between",
    },
    pictureInfoContainer: {
      height: "100%",
      width: "400px",
    },
  },

  container: {
    display: "flex",
    width: "100%",
    height: "100%",
  },
  containerChild: {
    flexGrow: "1",
  },
};

type Props = {
  hash: string;
  mediaFiles: MediaFile[];
  baseUrl: string; // for example, /gallery
  subview?: Subview;
};

function getMediaFileAtIndex(mediaFiles: MediaFile[], index: number) {
  if (index < 0 || index >= mediaFiles.length) {
    return null;
  }

  return mediaFiles[index];
}

type NavigationFunc = () => void;

type KeyUpCallbacks = {
  goBack: NavigationFunc;
  goToPrevious: NavigationFunc;
  goToNext: NavigationFunc;
};

function useListenToKeyUp({ goBack, goToPrevious, goToNext }: KeyUpCallbacks) {
  return function (event: KeyboardEvent) {
    switch (event.key) {
      case KeyCodes.ESCAPE:
        goBack();
        return;
      case KeyCodes.LEFT_ARROW:
        goToPrevious();
        return;
      case KeyCodes.RIGHT_ARROW:
        goToNext();
        return;
      default:
        return;
    }
  };
}

export default function MediaFileModal(props: Props) {
  const { mediaFiles, baseUrl, hash } = props;
  const [showInfo, setShowInfo] = React.useState(false);

  const mediaFileIdx = mediaFiles.findIndex(
    (mediaFile) => mediaFile.hashValue === hash
  );

  if (mediaFileIdx === -1) {
    return (
      <div className="alert alert-danger">
        No file found with this content hash
      </div>
    );
  }

  const previousMediaFile = getMediaFileAtIndex(mediaFiles, mediaFileIdx - 1);
  const mediaFile = getMediaFileAtIndex(mediaFiles, mediaFileIdx);
  const nextMediaFile = getMediaFileAtIndex(mediaFiles, mediaFileIdx + 1);

  React.useEffect(() => {
    const listenToKeyUp = useListenToKeyUp({
      goBack: () => (window.location.hash = `#${baseUrl}`),
      goToPrevious: () => {
        if (previousMediaFile) {
          window.location.hash = `#${baseUrl}/detail/${previousMediaFile.hashValue}`;
        }
      },
      goToNext: () => {
        if (nextMediaFile) {
          window.location.hash = `#${baseUrl}/detail/${nextMediaFile.hashValue}`;
        }
      },
    });

    document.addEventListener("keyup", listenToKeyUp);

    return () => document.removeEventListener("keyup", listenToKeyUp);
  }, [previousMediaFile, nextMediaFile]);

  if (mediaFile === null) {
    return <p>Image not found</p>;
  }

  const narrowScreen = isNarrowScreen();
  if (showInfo && narrowScreen) {
    return (
      <FullScreenModal>
        <FileInfoComponent
          mediaFile={mediaFile}
          onCloseButtonClicked={() => setShowInfo(!showInfo)}
        />
      </FullScreenModal>
    );
  }

  return (
    <FullScreenModal>
      <div style={styles.container}>
        <div style={styles.containerChild}>
          <ModalTopBar
            mediaFile={mediaFile}
            baseUrl={baseUrl}
            onInfoButtonClicked={() => setShowInfo(!showInfo)}
          />
          <WideScreenModal
            baseUrl={baseUrl}
            showInfo={showInfo}
            mediaFile={mediaFile}
            previousMediaFile={previousMediaFile}
            nextMediaFile={nextMediaFile}
          />
        </div>
        {showInfo && (
          <div style={styles.wideScreen.pictureInfoContainer}>
            <FileInfoComponent mediaFile={mediaFile} />
          </div>
        )}
      </div>
    </FullScreenModal>
  );
}
