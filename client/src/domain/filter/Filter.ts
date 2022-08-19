import { MediaFile } from "../MediaFile";

export interface Filter {
  filter(mediaFile: MediaFile): boolean;
  summary(): string;
}
