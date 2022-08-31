import * as React from "react";
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";
import { Record, getSpeedsFromRecords } from "../../domain/FitTrack";

type Props = {
  trackRecords: Record[];
  onChartMouseOver: (index: number) => void;
};

// https://recharts.org/en-US/examples/HighlightAndZoomLineChart
export default function SpeedChart(props: Props) {
  const { trackRecords, onChartMouseOver } = props;

  const minimumIntervalSeconds = 20;

  const speeds = getSpeedsFromRecords(trackRecords, minimumIntervalSeconds);
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
      name: middleTimeThroughSeconds + "min",
      time: middleTimeThroughSeconds,
      pace: parseFloat(pace.toFixed(2)),
    };
  });

  return (
    <>
      <LineChart
        width={600}
        height={300}
        data={chartData}
        onMouseMove={(event) => {
          const { activeTooltipIndex } = event;
          if (activeTooltipIndex) {
            onChartMouseOver(activeTooltipIndex);
          }
        }}
      >
        <Line type="monotone" dataKey="pace" stroke="#8884d8" />
        <CartesianGrid stroke="#ccc" />
        <XAxis
          type="number"
          dataKey="time"
          tickFormatter={(value) => `${(value / 60).toFixed(2)}min`}
        />
        <YAxis type="number" dataKey="pace" />
        <Tooltip />
        <Legend />
      </LineChart>
    </>
  );
}
