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
};

type ComponentState = {
  highestPace: number;
  lowestPace: number;
};

export default class SpeedChart extends React.Component<Props, ComponentState> {
  state = {
    highestPace: Number.MAX_VALUE,
    lowestPace: 0,
  };

  render() {
    // https://recharts.org/en-US/examples/HighlightAndZoomLineChart
    const data = this.getChartData();

    console.log("data", data);

    return (
      <>
        <label>
          Cap highest pace at
          <input
            type="number"
            onChange={(event) => {
              const highestPace = parseFloat(event.target.value);
              this.setState((state) => ({
                ...state,
                highestPace,
              }));
            }}
          />
        </label>
        <label>
          Cap lowest pace at
          <input
            type="number"
            onChange={(event) => {
              const lowestPace = parseFloat(event.target.value);
              this.setState((state) => ({
                ...state,
                lowestPace,
              }));
            }}
          />
        </label>

        <LineChart width={600} height={300} data={data}>
          <Line type="monotone" dataKey="pace" stroke="#8884d8" />
          <CartesianGrid stroke="#ccc" />
          <XAxis type="number" dataKey="time" />
          <YAxis type="number" dataKey="pace" />
          <Tooltip />
          <Legend />
        </LineChart>
      </>
    );
  }

  private getChartData() {
    const { trackRecords } = this.props;

    const minimumIntervalSeconds = 20;
    // const maximumNumberOfPoints = 1000;

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

    const { highestPace, lowestPace } = this.state;

    const data = points.map((point) => {
      const { speedMetresPerSecond, middleTimeThroughSeconds } = point;

      let pace = ((1 / speedMetresPerSecond) * 1000) / 60;

      if (highestPace && pace > highestPace) {
        pace = highestPace;
      }

      if (lowestPace && pace < lowestPace) {
        pace = lowestPace;
      }

      return {
        name: middleTimeThroughSeconds + "mypace",
        time: middleTimeThroughSeconds,
        pace: parseFloat(pace.toFixed(2)),
      };
    });

    return data;
  }
}
