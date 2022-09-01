import { Duration } from "src/domain/duration";
import { FitTrack, Lap } from "src/domain/FitTrack";

const styles = {
  table: { color: "whitesmoke" },
};

type Props = { laps: Lap[]; trackSummary: FitTrack };

export default function TrackModalTable(props: Props) {
  const { trackSummary, laps } = props;
  const lapsRows = laps.map((lap, index) => (
    <tr key={index}>
      <td>{index + 1}</td>
      <td>{lap.distance.toFixed(2)}m</td>
      <td>{lap.time.getDisplayString()}</td>
    </tr>
  ));

  const duration = new Duration(trackSummary.startTime, trackSummary.endTime);

  return (
    <table className="table" style={styles.table}>
      <thead>
        <tr>
          <th>Lap</th>
          <th>Distance</th>
          <th>Time</th>
        </tr>
      </thead>
      <tbody>
        {lapsRows}
        <tr>
          <td>Total</td>
          <td>{trackSummary.totalDistance}m</td>
          <td>{duration.getDisplayString()}</td>
        </tr>
      </tbody>
    </table>
  );
}
