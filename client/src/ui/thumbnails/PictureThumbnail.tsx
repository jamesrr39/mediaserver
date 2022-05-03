import * as React from "react";
import { PictureMetadata } from "../../domain/PictureMetadata";
import { Size } from "../../domain/Size";
import { THUMBNAIL_HEIGHTS } from "../../generated/thumbnail_sizes";

type Props = {
  pictureMetadata: PictureMetadata;
  size: Size;
};

type ComponentState = {
  isLoaded: boolean;
};

export class PictureThumbnail extends React.Component<Props, ComponentState> {
  state = {
    isLoaded: false,
  };

  render() {
    const { size, pictureMetadata } = this.props;

    if (!this.state.isLoaded) {
      const style = {
        width: size.width + "px",
        height: size.height + "px",
        backgroundColor: "#ddd",
      };
      return <div style={style}></div>;
    }

    let thumbnailHeight = THUMBNAIL_HEIGHTS.find((height) => {
      return height >= size.height;
    });
    if (!thumbnailHeight) {
      thumbnailHeight = pictureMetadata.rawSize.height;
    }

    const imgSrc = `file/picture/${encodeURIComponent(
      pictureMetadata.hashValue
    )}?h=${encodeURIComponent(thumbnailHeight)}`;

    const style = {
      width: size.width + "px",
      height: size.height + "px",
      backgroundImage: `url(${imgSrc})`,
      backgroundSize: "cover",
    };

    return <div style={style} />;
  }

  componentDidMount() {
    const { size, pictureMetadata } = this.props;

    const imgSrc = `file/picture/${encodeURIComponent(
      pictureMetadata.hashValue
    )}?h=${encodeURIComponent(size.height)}`;

    const image = new Image();
    image.onload = () => {
      this.setState((state) => ({
        ...state,
        isLoaded: true,
      }));
    };
    image.src = imgSrc;
  }
}
