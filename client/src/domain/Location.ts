export type MapLocation = {
  lat: number;
  lon: number;
};

export type SuggestedLocation = {
  reason: string;
} & MapLocation;
