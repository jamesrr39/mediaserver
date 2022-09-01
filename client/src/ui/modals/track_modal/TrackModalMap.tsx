import { FitTrack, Record } from "src/domain/FitTrack";
import MapComponent, { MapMarker } from "src/ui/MapComponent";

export type SelectedSection = {
  lower: Record;
  upper: Record;
};

type Props = {
  trackRecords: Record[];
  trackSummary: FitTrack;
  highlightedRecord: Record;
  selectedSection?: SelectedSection;
};

export default function TrackModalMap(props: Props) {
  const { trackSummary, trackRecords, selectedSection } = props;

  const size = {
    width: "100%",
    height: "400px",
  };
  const tracks = [
    {
      trackSummary,
      points: trackRecords.map((record) => ({
        lat: record.posLat,
        lon: record.posLong,
      })),
      activityBounds: trackSummary.activityBounds,
    },
  ];

  let markers = undefined as undefined | MapMarker[];
  if (selectedSection) {
    markers = [
      {
        location: {
          lat: selectedSection.lower.posLat,
          lon: selectedSection.lower.posLong,
        },
      },
      {
        location: {
          lat: selectedSection.upper.posLat,
          lon: selectedSection.upper.posLong,
        },
      },
    ];
  }

  return (
    <MapComponent
      size={size}
      tracks={tracks}
      zoomControl={true}
      onClickPoint={(latLng) => console.log("latLng clicked: ", latLng)}
      markers={markers}
    />
  );
}
