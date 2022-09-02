import { FitTrack, Record } from "src/domain/FitTrack";
import MapComponent, { SelectedSection } from "src/ui/MapComponent";

type Props = {
  trackRecords: Record[];
  trackSummary: FitTrack;
  highlightedRecord: Record;
  selectedSection?: SelectedSection;
};

export default function TrackModalMap(props: Props) {
  const { trackSummary, trackRecords, selectedSection } = props;
  const { activityBounds } = trackSummary;

  const size = {
    width: "100%",
    height: "400px",
  };
  const tracks = [
    {
      trackSummary,
      points: trackRecords.map((record, idx) => ({
        lat: record.posLat,
        lon: record.posLong,
        idx,
      })),
      activityBounds,
      selectedSection,
    },
  ];

  return (
    <MapComponent
      size={size}
      tracks={tracks}
      zoomControl={true}
      onClickPoint={(latLng) => console.log("latLng clicked: ", latLng)}
    />
  );
}
