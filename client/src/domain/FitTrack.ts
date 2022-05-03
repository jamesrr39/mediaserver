import { MediaFileType } from "./MediaFileType";
import { Duration } from "./duration";
import { AbstractMediaFile } from "./AbstractMediaFile";
import { SuggestedLocation } from "./Location";

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
  latMin: number;
  latMax: number;
  longMin: number;
  longMax: number;
};

export class FitTrack extends AbstractMediaFile {
  public readonly fileType = MediaFileType.FitTrack;
  constructor(
    public readonly hashValue: string,
    public readonly relativePath: string,
    public readonly fileSizeBytes: number,
    public readonly participantIds: number[],
    public readonly startTime: Date,
    public readonly endTime: Date,
    public readonly deviceManufacturer: string,
    public readonly deviceProduct: string,
    public readonly totalDistance: number,
    public readonly activityBounds: ActivityBounds,
    public readonly suggestedLocation?: SuggestedLocation
  ) {
    super(hashValue, relativePath, fileSizeBytes);
  }

  getLocation() {
    return null; // TODO
  }
  getTimeTaken() {
    return this.startTime;
  }
  getDuration() {
    return new Duration(this.startTime, this.endTime);
  }
}

export type Record = {
  timestamp: Date;
  posLat: number;
  posLong: number;
  distance: number;
  altitude: number;
};

export type Lap = {
  time: Duration;
  distance: number;
};

export function getLapsFromRecords(records: Record[], interval: number) {
  if (records.length === 0) {
    return [];
  }

  const laps: Lap[] = [];
  let nextInterval = interval;
  let timestampOfLastInterval = records[0].timestamp;
  let lastIntervalDistance = 0;

  for (let i = 0; i < records.length; i++) {
    const record = records[i];

    const hasReachedNextInterval = record.distance >= nextInterval;
    const isLastRecord = i === records.length - 1;
    if (!hasReachedNextInterval && !isLastRecord) {
      continue;
    }

    laps.push({
      time: new Duration(
        new Date(timestampOfLastInterval),
        new Date(record.timestamp)
      ),
      distance: record.distance - lastIntervalDistance,
    });
    nextInterval += interval;
    timestampOfLastInterval = record.timestamp;
    lastIntervalDistance = record.distance;
  }

  return laps;
}

type SpeedWithTime = {
  speedMetresPerSecond: number;
  startTimeThroughSeconds: number;
  endTimeThroughSeconds: number;
  startDistanceMetres: number;
  endDistanceMetres: number;
};

export function getSpeedsFromRecords(
  records: Record[],
  intervalDistanceSeconds: number
) {
  if (records.length === 0) {
    return [];
  }

  const speeds: SpeedWithTime[] = [];
  let lastRecord = records[0];
  const firstRecordTime = lastRecord.timestamp;

  records.slice(1).forEach((record, index) => {
    const timeSinceLastIntervalSeconds =
      (record.timestamp.getTime() - lastRecord.timestamp.getTime()) / 1000;
    const isLastRecord = index === records.length - 1;
    if (
      timeSinceLastIntervalSeconds >= intervalDistanceSeconds ||
      isLastRecord
    ) {
      const distanceTravelledMetres = record.distance - lastRecord.distance;
      const speedMetresPerSecond =
        distanceTravelledMetres / timeSinceLastIntervalSeconds;
      const startTimeThroughSeconds =
        (lastRecord.timestamp.getTime() - firstRecordTime.getTime()) / 1000;
      const endTimeThroughSeconds =
        (record.timestamp.getTime() - firstRecordTime.getTime()) / 1000;

      speeds.push({
        speedMetresPerSecond,
        startTimeThroughSeconds,
        endTimeThroughSeconds,
        startDistanceMetres: record.distance,
        endDistanceMetres: lastRecord.distance,
      });
      lastRecord = record;
    }
  });

  return speeds;
}

export type TrackDetail = {
  hash: string;
  records: Record[];
};
