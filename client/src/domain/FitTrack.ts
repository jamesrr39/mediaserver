import { MediaFile, MediaFileType } from './MediaFile';

/*
Fit file summary

MediaFileInfo
StartTime          time.Time       `json:"startTime"`
EndTime            time.Time       `json:"endTime"`
DeviceManufacturer string          `json:"deviceManufacturer"`
DeviceProduct      string          `json:"deviceProduct"`
TotalDistance      float64         `json:"totalDistance"`
ActivityBounds     *ActivityBounds `json:"activityBounds"`
*/

/*
ActivityBounds:

LatMin  float64 `json:"latMin"`  // between -90 (south pole) and +90 (north pole)
LatMax  float64 `json:"latMax"`  // between -90 (south pole) and +90 (north pole)
LongMin float64 `json:"longMin"` // between -180 and +180
LongMax float64 `json:"longMax"` // between -180 and +180
*/

export type ActivityBounds = {
  latMin: number,
  latMax: number,
  longMin: number,
  longMax: number,
};

export class FitTrack extends MediaFile {
  public fileType = MediaFileType.FitTrack;
  constructor(
    public readonly hashValue: string,
    public readonly relativePath: string,
    public readonly fileSizeBytes: number,
    public readonly startTime: Date,
    public readonly endTime: Date,
    public readonly deviceManufacturer: string,
    public readonly deviceProduct: string,
    public readonly totalDistance: number,
    public readonly activityBounds: ActivityBounds[]) {
      super(hashValue, relativePath, fileSizeBytes);
    }

    getLocation() {
      return null; // TODO
    }
    getTimeTaken() {
      return this.startTime;
    }
}
