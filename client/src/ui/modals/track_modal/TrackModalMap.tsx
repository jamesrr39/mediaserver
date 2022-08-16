import { LatLng } from "leaflet";
import { FitTrack, Record } from "src/domain/FitTrack";
import MapComponent from "src/ui/MapComponent";

type Props = {
  trackRecords: Record[];
  trackSummary: FitTrack;
  selectedSections?: {
    lower: Record;
    upper: Record;
  };
};

export default function TrackModalMap(props: Props) {
  const { trackSummary, trackRecords, selectedSections } = props;

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

  let markers = undefined;
  if (selectedSections) {
    markers = [
      {
        location: {
          lat: selectedSections.lower.posLat,
          lon: selectedSections.lower.posLong,
        },
      },
      {
        location: {
          lat: selectedSections.upper.posLat,
          lon: selectedSections.upper.posLong,
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
