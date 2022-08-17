import * as React from "react";
import AllPicturesGallery from "./AllPicturesGallery";
import { Route, Navigate, Routes } from "react-router-dom";
import { connect } from "react-redux";
import { State } from "../reducers/rootReducer";
import { PeopleMap } from "../actions/mediaFileActions";
import { HashRouter } from "react-router-dom";
import MediaserverTopBar from "./MediaserverTopBar";
import CollectionsComponent from "./collections/CollectionsListingComponent";
import { CustomCollection } from "../domain/Collection";
import NotificationBarComponent from "./NotificationBarComponent";
import UploadComponent from "./upload/UploadComponent";
import { MediaFile } from "../domain/MediaFile";
import UploadProgressComponent from "./upload/UploadProgressComponent";
import MediafilesMap from "./MediafilesMap";
import { Win } from "../actions/windowActions";
import { LoadingState } from "../actions/util";
import { EditCustomCollectionScreen } from "./collections/EditCustomCollectionScreen";
import AllPicturesModalScreen from "./modals/AllPicturesModalScreen";
import PictureInCollectionModalScreen from "./modals/PictureInCollectionModalScreen";
import CollectionViewScreen, {
  CollectionViewNavBarComponent,
} from "./collections/CollectionViewScreen";

type MediaServerProps = {
  mediaFiles: MediaFile[];
  mediaFilesMap: Map<string, MediaFile>;
  peopleMap: PeopleMap;
  customCollections: CustomCollection[];
  window: Win;
  loadingState: LoadingState;
};

const withNavBar = (component: JSX.Element, navBarChild?: React.ReactNode) => (
  <>
    <MediaserverTopBar {...{ child: navBarChild }} />
    {component}
  </>
);

const styles = {
  notificationsComponent: {
    position: "fixed" as "fixed",
    left: "30px",
    bottom: "30px",
    zIndex: 1001,
  },
  uploadProgressComponent: {
    position: "fixed" as "fixed",
    right: "30px",
    bottom: "30px",
    zIndex: 1000,
  },
};

function MediaServer(props: MediaServerProps) {
  const {
    loadingState,
    peopleMap,
    customCollections,
    mediaFiles,
    mediaFilesMap,
  } = props;

  if (loadingState === LoadingState.IN_PROGRESS) {
    return <p>Loading...</p>;
  }

  if (loadingState === LoadingState.FAILED) {
    return <p>Error: failed to load</p>;
  }

  return (
    <HashRouter>
      <div>
        <Routes>
          <Route
            path="/collections/:type/:identifier/edit"
            element={withNavBar(
              <EditCustomCollectionScreen
                peopleMap={peopleMap}
                customCollections={customCollections}
              />
            )}
          />
          <Route
            path="/collections/:type/:identifier"
            element={withNavBar(
              <CollectionViewScreen
                mediaFiles={mediaFiles}
                peopleMap={peopleMap}
                customCollections={customCollections}
              />,
              <CollectionViewNavBarComponent
                mediaFiles={mediaFiles}
                customCollections={customCollections}
              />
            )}
          />
          <Route
            path="/collections/:type/:identifier/detail/:hash"
            element={withNavBar(
              <PictureInCollectionModalScreen
                mediaFiles={mediaFiles}
                mediaFilesMap={mediaFilesMap}
                customCollections={customCollections}
              />
            )}
          />
          <Route
            path="/collections"
            element={withNavBar(<CollectionsComponent />, <UploadComponent />)}
          />
          <Route
            path="/map"
            element={withNavBar(
              <MediafilesMap mediaFileUrlBase="/gallery/detail" />,
              <UploadComponent />
            )}
          />
          <Route
            path="/gallery"
            element={withNavBar(<AllPicturesGallery />, <UploadComponent />)}
          />
          <Route
            path="/gallery/detail/:hash"
            element={withNavBar(
              <AllPicturesModalScreen mediaFiles={mediaFiles} />,
              <UploadComponent />
            )}
          />
          <Route path="/" element={<Navigate to="/gallery" />} />
        </Routes>
        <div style={styles.notificationsComponent}>
          <NotificationBarComponent />
        </div>
        <div style={styles.uploadProgressComponent}>
          <UploadProgressComponent />
        </div>
      </div>
    </HashRouter>
  );
}

function getCombinedLoadingState(
  ...loadingStates: LoadingState[]
): LoadingState {
  if (
    loadingStates.findIndex(
      (loadingState) => loadingState === LoadingState.FAILED
    ) !== -1
  ) {
    return LoadingState.FAILED;
  }

  if (
    loadingStates.findIndex(
      (loadingState) => loadingState === LoadingState.NOT_STARTED
    ) !== -1
  ) {
    return LoadingState.NOT_STARTED;
  }

  if (
    loadingStates.findIndex(
      (loadingState) => loadingState === LoadingState.IN_PROGRESS
    ) !== -1
  ) {
    return LoadingState.IN_PROGRESS;
  }

  return LoadingState.SUCCESS;
}

function mapStateToProps(state: State) {
  const {
    mediaFiles,
    mediaFilesMap,
    loadingState: mediaFilesLoadingState,
  } = state.mediaFilesReducer;
  const { customCollections, loadingState: collectionsLoadingState } =
    state.collectionsReducer;
  const { peopleMap, loadingState: peopleLoadingState } = state.peopleReducer;

  return {
    mediaFiles,
    mediaFilesMap,
    peopleMap,
    customCollections,
    window: state.windowReducer,
    loadingState: getCombinedLoadingState(
      mediaFilesLoadingState,
      collectionsLoadingState,
      peopleLoadingState
    ),
  };
}

export default connect(mapStateToProps)(MediaServer);
