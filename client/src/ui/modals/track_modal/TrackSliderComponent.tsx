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

const MIN = 0;
const MAX = 100;

type Props = {
  onChange: (newValues: { lower: number; upper: number }) => void;
};

export default function TrackSliderComponent(props: Props) {
  const [slider1Val, setSlider1Val] = useState(MIN);
  const [slider2Val, setSlider2Val] = useState(MAX);

  const range = MAX - MIN;

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
          min={MIN}
          max={MAX}
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
          min={MIN}
          max={MAX}
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
