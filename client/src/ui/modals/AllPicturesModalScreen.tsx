// import * as React from 'react';
import { useParams } from "react-router-dom";
import { filterFromJson } from "../../domain/filter/GalleryFilter";
import { MediaFile } from "../../domain/MediaFile";
import { gallerySortingFunc } from "./../gallery/GalleryWithFilter";
import MediaFileModal from "./MediaFileModal";

type AllPicturesPictureModalRouteParams = {
  hash: string;
  filterJson?: string;
};

type Props = { mediaFiles: MediaFile[] };

function AllPicturesModalScreen(props: Props) {
  const params = useParams<AllPicturesPictureModalRouteParams>();
  const filter = filterFromJson(params.filterJson || "{}");
  const mediaFiles = props.mediaFiles.filter((mediaFile) =>
    filter.filter(mediaFile)
  );
  mediaFiles.sort(gallerySortingFunc);

  return (
    <MediaFileModal
      mediaFiles={mediaFiles}
      hash={decodeURIComponent(params.hash || "")}
      baseUrl="/gallery"
    />
  );
}

export default AllPicturesModalScreen;
