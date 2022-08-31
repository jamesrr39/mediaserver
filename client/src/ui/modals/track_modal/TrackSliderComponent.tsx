import { useState } from "react";

function getLowerAndUpper(val1: number, val2: number) {
  if (val1 < val2) {
    return {
      lower: val1,
      upper: val2,
    };
  }

  return {
    lower: val2,
    upper: val1,
  };
}

const styles = {
  outer: {
    width: "100%",
  },
  slider: {
    width: "100%",
    height: "3px",
    margin: "10px 0",
    backgroundColor: "gray",
    position: "relative" as "relative",
  },
  middle: {
    backgroundColor: "orange",
    height: "3px",
    margin: "5px 0",
  },
  rangeSlider: {
    position: "absolute" as "absolute",
    height: 0, // make round drag icons still visible, but the bar becomes invisible
    width: "100%",
  },
};

export type TimeRange = { lower: number; upper: number };

type Props = {
  min: number;
  max: number;
  onChange: (newValues: TimeRange) => void;
};

export default function TrackSliderComponent(props: Props) {
  const { max, min } = props;
  const [slider1Val, setSlider1Val] = useState(min);
  const [slider2Val, setSlider2Val] = useState(max);

  const range = max - min;

  const lowerAndUpper = getLowerAndUpper(slider1Val, slider2Val);
  const { lower, upper } = lowerAndUpper;
  const widthPercentage = ((upper - lower) / range) * 100;
  const marginLeftPercentage = (lower / range) * 100;

  return (
    <div style={styles.outer}>
      <div style={styles.slider}>
        <input
          style={styles.rangeSlider}
          type="range"
          min={min}
          max={max}
          onChange={(e) => {
            const val = parseFloat(e.target.value);
            setSlider1Val(val);
            props.onChange(getLowerAndUpper(val, slider2Val));
          }}
          defaultValue={slider1Val}
        />
        <input
          style={{ ...styles.rangeSlider, zIndex: 10001 }}
          type="range"
          min={min}
          max={max}
          onChange={(e) => {
            const val = parseFloat(e.target.value);
            setSlider2Val(val);
            props.onChange(getLowerAndUpper(slider1Val, val));
          }}
          defaultValue={slider2Val}
        />
        <div
          style={{
            ...styles.middle,
            width: `${widthPercentage}%`,
            marginLeft: `${marginLeftPercentage}%`,
          }}
        ></div>
      </div>
    </div>
  );
}
