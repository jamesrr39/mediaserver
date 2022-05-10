import { useState } from "react";

type Props = {};

export default function TimeDistanceToggle(props: Props) {
  const [value, setValue] = useState("time" as "time" | "distance");

  return (
    <div>
      <div className="btn-group btn-group-toggle" data-toggle="buttons">
        <label className="btn btn-secondary active">
          <input
            type="radio"
            name="timeDistanceRadio"
            checked={value === "time"}
            onChange={() => setValue("time")}
          />{" "}
          Time
        </label>
        <label className="btn btn-secondary">
          <input
            type="radio"
            name="timeDistanceRadio"
            checked={value === "distance"}
            onChange={() => setValue("distance")}
          />{" "}
          Distance
        </label>
      </div>
    </div>
  );
}
