import { createContext } from "react";
import { MediaFile } from "src/domain/MediaFile";

export type SelectThumbnailFunc = (
  mediaFile: MediaFile,
  selected: boolean
) => void;

export const SelectThumbnailContext = createContext<SelectThumbnailFunc>(null);
