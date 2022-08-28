import { FitTrack } from "../../domain/FitTrack";
import MapComponent from "../MapComponent";
import { fetchRecordsForTracks } from "../../actions/mediaFileActions";
import { useDispatch, useSelector } from "react-redux";
import { Size } from "../../domain/Size";
import { useQuery } from "react-query";
import { State } from "src/reducers/rootReducer";

type Props = {
  size: Size;
  trackSummary: FitTrack;
};

function TrackThumbnail(props: Props) {
  const { trackSummary, size } = props;
  const { width, height } = size;

  const dispatch = useDispatch();
  const state = useSelector((state: State) => state);

  const { data, isLoading, error } = useQuery(
    `track-records-${trackSummary.hashValue}`,
    () => fetchRecordsForTracks([trackSummary])(dispatch, () => state)
  );
  if (error) {
    return <div>error loading track records</div>;
  }

  if (isLoading) {
    return <div>Loading...</div>;
  }

  const trackRecords = data.get(trackSummary.hashValue);

  const sizeStyle = {
    width: width + "px",
    height: height + "px",
  };

  const tracks = [
    {
      trackSummary,
      points: trackRecords.map((record) => {
        const { posLat, posLong } = record;

        return {
          lat: posLat,
          lon: posLong,
        };
      }),
      activityBounds: trackSummary.activityBounds,
    },
  ];

  return (
    <div>
      <MapComponent size={sizeStyle} tracks={tracks} zoomControl={false} />
    </div>
  );
}

export default TrackThumbnail;
