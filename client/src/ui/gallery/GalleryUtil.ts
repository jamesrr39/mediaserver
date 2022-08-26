import { MediaFile } from "src/domain/MediaFile";
import { Size } from "src/domain/Size";

export const GALLERY_GROUP_LEFT_MARGIN_PX = 50;

export const GALLERY_FILE_LEFT_MARGIN_PX = 10;

export interface GroupWithSizes {
  name: string;
  mediaFiles: MediaFileWithSize[];
  value: number; // higher = sorted first
}
export type Row = {
  groups: GroupWithSizes[];
  fitsInOneLine: boolean;
};

export type MediaFileWithSize = {
  mediaFile: MediaFile;
  size: Size;
};
