import { FitTrack } from "../../../domain/FitTrack";
import TrackDetailsComponent from "./TrackDetailsComponent";
import { useTrackRecords } from "src/hooks/trackRecordHooks";

function displayDistance(distanceMetres: number): string {
  const flooredDistanceMetres = Math.floor(distanceMetres);
  if (flooredDistanceMetres < 1000) {
    return `${flooredDistanceMetres}m`;
  }

  const wholeKm = Math.floor(flooredDistanceMetres / 1000);
  const remainderMetres = flooredDistanceMetres - wholeKm * 1000;

  return `${wholeKm}.${remainderMetres}km`;
}

const styles = {
  container: {
    width: "100%",
    overflow: "auto",
    height: "100%",
  },
};

const dateLocaleOpts = {
  weekday: "long" as "long",
  day: "numeric" as "numeric",
  month: "long" as "long",
  year: "numeric" as "numeric",
};

type Props = {
  trackSummary: FitTrack;
  ts: number;
};

function TrackModalContent(props: Props) {
  const { trackSummary } = props;

  return (
    <div style={styles.container}>
      <h3>
        {trackSummary.startTime.toLocaleDateString(undefined, dateLocaleOpts)}{" "}
        at {trackSummary.startTime.toLocaleTimeString()}
      </h3>
      <small>{trackSummary.relativePath}</small>
      <p>
        {displayDistance(trackSummary.totalDistance)} in{" "}
        {trackSummary.getDuration().getDisplayString()}
      </p>
      <TrackDetailsComponent trackSummary={trackSummary} />
    </div>
  );
}

export default TrackModalContent;
