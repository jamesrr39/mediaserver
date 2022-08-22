import * as React from "react";
import AllPicturesGallery from "./AllPicturesGallery";
import { Route, Navigate, Routes } from "react-router-dom";
import { connect, useDispatch } from "react-redux";
import { State } from "../reducers/rootReducer";
import {
  fetchPicturesMetadata,
  FilesActionTypes,
  PeopleMap,
} from "../actions/mediaFileActions";
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
import { EditCustomCollectionScreen } from "./collections/EditCustomCollectionScreen";
import AllPicturesModalScreen from "./modals/AllPicturesModalScreen";
import PictureInCollectionModalScreen from "./modals/PictureInCollectionModalScreen";
import CollectionViewScreen, {
  CollectionViewNavBarComponent,
} from "./collections/CollectionViewScreen";
import {
  CollectionActions,
  fetchCollections,
} from "src/actions/collectionsActions";
import { fetchAllPeople, PeopleActionTypes } from "src/actions/peopleActions";
import { isError, useQuery } from "react-query";

type MediaServerProps = {
  mediaFiles: MediaFile[];
  mediaFilesMap: Map<string, MediaFile>;
  peopleMap: PeopleMap;
  customCollections: CustomCollection[];
  window: Win;
};

function useFetchMediaserverData() {
  const dispatch = useDispatch();

  return useQuery("mediaserver-data", async () => {
    const fns = [
      () => fetchPicturesMetadata()(dispatch),
      () => fetchCollections()(dispatch),
      () => fetchAllPeople()(dispatch),
      // connectToWebsocket(),
    ];

    const datasets = await Promise.all(fns.map((fn) => fn()));

    const [mediaFiles, customCollections, people] = datasets;

    return { mediaFiles, customCollections, people };
  });
}

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
  const { isLoading, isError } = useFetchMediaserverData();

  if (isLoading) {
    return <p>Loading...</p>;
  }

  if (isError) {
    return <p>Error: failed to load</p>;
  }

  const { peopleMap, customCollections, mediaFiles, mediaFilesMap } = props;

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

function mapStateToProps(state: State) {
  const { mediaFiles, mediaFilesMap } = state.mediaFilesReducer;
  const { customCollections } = state.collectionsReducer;
  const { peopleMap } = state.peopleReducer;

  return {
    peopleMap,
    customCollections,
    mediaFiles,
    mediaFilesMap,
    window: state.windowReducer,
  };
}

export default connect(mapStateToProps)(MediaServer);
