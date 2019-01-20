import * as React from 'react';
import { SERVER_BASE_URL } from '../../configs';
import { VideoMetadata } from '../../domain/VideoMetadata';

const styles = {
    video: {
        pointerEvents: 'none' as 'none',
    },
};

type Props = {
    videoMetadata: VideoMetadata
    size: {width: number, height: number}
};

export class VideoThumbnail extends React.Component<Props> {

    render() {
        const { videoMetadata, size } = this.props;

        const videoUrl = `${SERVER_BASE_URL}/video/${videoMetadata.hashValue}`;

        return (
        <div>
            <video height={size.height} width={size.width} controls={true} style={styles.video}>
            <source src={videoUrl} />
            Your browser does not support HTML5 video.
            </video>
        </div>
        );
    }
    triggerInView() {
        // no-op
    }
}