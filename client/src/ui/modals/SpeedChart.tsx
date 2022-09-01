import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Time } from "ts-util/src/Time";
import { FitTrack, getSpeedsFromRecords, Record } from "../../domain/FitTrack";

type Props = {
  trackSummary: FitTrack;
  trackRecords: Record[];
  onChartMouseOver: (index: number) => void;
};

// https://recharts.org/en-US/examples/HighlightAndZoomLineChart
export default function SpeedChart(props: Props) {
  const { trackSummary, trackRecords, onChartMouseOver } = props;

  const minimumIntervalSeconds = 20;

  const speeds = getSpeedsFromRecords(
    trackSummary,
    trackRecords,
    minimumIntervalSeconds
  );
  if (speeds.length === 0) {
    return;
  }

  const points = speeds
    .map((speedWithTime) => {
      const {
        startTimeThroughSeconds,
        endTimeThroughSeconds,
        startDistanceMetres,
        endDistanceMetres,
        speedMetresPerSecond,
      } = speedWithTime;
      const middleTimeThroughSeconds = Math.round(
        (startTimeThroughSeconds + endTimeThroughSeconds) / 2
      );
      const middleDistanceMetres = Math.round(
        (startDistanceMetres + endDistanceMetres) / 2
      );

      return {
        middleTimeThroughSeconds,
        middleDistanceMetres,
        speedMetresPerSecond,
      };
    })
    .filter((point) => point.speedMetresPerSecond !== 0); // filter out points where no distance

  const chartData = points.map((point) => {
    const { speedMetresPerSecond, middleTimeThroughSeconds } = point;

    let pace = ((1 / speedMetresPerSecond) * 1000) / 60;

    return {
      name: new Time(middleTimeThroughSeconds).toString(),
      time: middleTimeThroughSeconds,
      pace: parseFloat(pace.toFixed(2)),
    };
  });

  return (
    <ResponsiveContainer width="100%" height={400}>
      <AreaChart
        data={chartData}
        onMouseMove={(event) => {
          const { activeTooltipIndex } = event;
          if (activeTooltipIndex) {
            onChartMouseOver(activeTooltipIndex);
          }
        }}
      >
        <XAxis dataKey="name" />
        <YAxis label={"min/km"} />
        <CartesianGrid stroke="#ccc" />
        <Area type="monotone" dataKey="pace" stroke="#8884d8" fill="#8884d8" />
        <Tooltip />
      </AreaChart>
    </ResponsiveContainer>
  );
}
