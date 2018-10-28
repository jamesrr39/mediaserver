import { getLapsFromRecords } from '../FitTrack';

test('getLapsFromRecords', () => {
  const records = [{
    // timestamp: new Date(1500743072030),
    timestamp: new Date(0),
    posLat: 0,
    posLong: 0,
    distance: 800,
    altitude: 0,
  }, {
    timestamp: new Date(10 * 1000),
    posLat: 0,
    posLong: 0,
    distance: 950,
    altitude: 0,
  }, {
    timestamp: new Date(20 * 1000),
    posLat: 0,
    posLong: 0,
    distance: 1200,
    altitude: 0,
  }, {
    timestamp: new Date(25 * 1000),
    posLat: 0,
    posLong: 0,
    distance: 1600,
    altitude: 0,
  }, {
    timestamp: new Date(30 * 1000),
    posLat: 0,
    posLong: 0,
    distance: 2100,
    altitude: 0,
  }, {
    timestamp: new Date(35 * 1000),
    posLat: 0,
    posLong: 0,
    distance: 2300,
    altitude: 0,
  }];

  const laps = getLapsFromRecords(records, 1000);

  expect(laps).toHaveLength(3);
  expect(laps[0].distance).toBe(1200);
  expect(laps[0].time.getSeconds()).toBe(20);
  expect(laps[2].distance).toBe(200);
  expect(laps[2].time.getSeconds()).toBe(5);
});
