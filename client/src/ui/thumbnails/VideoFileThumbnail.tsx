import * as React from "react";
import { VideoMetadata } from "../../domain/VideoMetadata";
import { Size } from "../../domain/Size";

const styles = {
  video: {
    pointerEvents: "none" as "none",
  },
};

type Props = {
  videoMetadata: VideoMetadata;
  size: Size;
};

export class VideoThumbnail extends React.Component<Props> {
  render() {
    const { videoMetadata, size } = this.props;

    const videoUrl = `/file/video/${encodeURIComponent(
      videoMetadata.hashValue
    )}`;

    return (
      <div>
        <video
          height={size.height}
          width={size.width}
          controls={true}
          style={styles.video}
        >
          <source src={videoUrl} />
          Your browser does not support HTML5 video.
        </video>
      </div>
    );
  }
}
