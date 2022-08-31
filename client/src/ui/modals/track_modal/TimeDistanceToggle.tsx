import { useState } from "react";

export type Value = "time" | "distance";

type Props = {
  onChange(value: Value): void;
};

export default function TimeDistanceToggle(props: Props) {
  const [value, setValue] = useState("time" as Value);

  return (
    <div>
      <div className="btn-group btn-group-toggle" data-toggle="buttons">
        <label className="btn btn-secondary active">
          <input
            type="radio"
            name="timeDistanceRadio"
            checked={value === "time"}
            onChange={() => {
              setValue("time");
              props.onChange("time");
            }}
          />{" "}
          Time
        </label>
        <label className="btn btn-secondary">
          <input
            type="radio"
            name="timeDistanceRadio"
            checked={value === "distance"}
            onChange={() => {
              setValue("distance");
              props.onChange("distance");
            }}
          />{" "}
          Distance
        </label>
      </div>
    </div>
  );
}
