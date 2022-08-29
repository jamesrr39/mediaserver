import React from "react";
import GalleryFilter from "src/domain/filter/GalleryFilter";
import { MediaFile } from "src/domain/MediaFile";

export type BuildLinkFunc = (mediaFile: MediaFile) => string;

export const BuildLinkContext = React.createContext<BuildLinkFunc>(null);

export function createBuildLinkFunc(
  filter: GalleryFilter,
  mediaFileUrlBase: string
) {
  return function (mediaFile: MediaFile) {
    const query = `filterJson=${encodeURIComponent(filter.toJSON())}`;
    const linkUrl = `${mediaFileUrlBase}/${mediaFile.hashValue}?${query}`;
    return linkUrl;
  };
}
