import { Link } from "react-router-dom";
import { navButtonTextStyle } from "./style";

type Props = {
  direction: "forwards" | "back";
  linkUrl: string;
  ariaLabel: string;
};

export default function NavigationArrow(props: Props) {
  const { direction, linkUrl, ariaLabel } = props;

  const style: React.CSSProperties = {
    ...navButtonTextStyle,
  };

  if (direction === "forwards") {
    style.right = "0px";
  } else {
    style.left = "0px";
  }

  return (
    <Link to={linkUrl} style={style} aria-label={ariaLabel}>
      {direction === "forwards" ? <>&rarr;</> : <>&larr;</>}
    </Link>
  );
}
