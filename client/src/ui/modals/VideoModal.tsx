import { MediaFile } from '../../domain/MediaFile';

export default ({mediaFile}: {mediaFile: MediaFile}) => {
    const videoUrl = `/file/video/${encodeURIComponent(mediaFile.hashValue)}`;
    return (
      <video width="100%" controls={true} key={mediaFile.hashValue}>
        <source src={videoUrl} />
        Your browser does not support HTML5 video.
      </video>
    );
};