import { MediaFile } from '../../domain/MediaFile';
import { SERVER_BASE_URL } from '../../configs';

export default ({mediaFile}: {mediaFile: MediaFile}) => {
    const videoUrl = `${SERVER_BASE_URL}/file/video/${mediaFile.hashValue}`;
    return (
      <video width="100%" controls={true} key={mediaFile.hashValue}>
        <source src={videoUrl} />
        Your browser does not support HTML5 video.
      </video>
    );
};