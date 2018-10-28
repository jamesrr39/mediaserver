import { PictureMetadata, createCompareTimeTakenFunc, ExifData } from '../PictureMetadata';

test('createCompareTimeTakenFunc creates a sorting function based on the time the picture was taken', () => {
  const mockSize = {height: 200, width: 200};

  const pictureMetadatas = [
    new PictureMetadata('', 'a', 0, {DateTime: '2018:01:22 16:29:03'}, mockSize),
    new PictureMetadata('', 'b', 0, {DateTime: '2018:01:22 17:29:03'}, mockSize),
    new PictureMetadata('', 'c', 0, {DateTime: '2018:01:22 16:49:03'}, mockSize),
    new PictureMetadata('', 'd', 0, null, mockSize),
  ];

  const compareFunc = createCompareTimeTakenFunc(true);
  pictureMetadatas.sort(compareFunc);
  expect(pictureMetadatas[0].relativePath).toBe('b');
  expect(pictureMetadatas[1].relativePath).toBe('c');
  expect(pictureMetadatas[2].relativePath).toBe('a');
  expect(pictureMetadatas[3].relativePath).toBe('d');

  const compareNullFirstFunc = createCompareTimeTakenFunc(false);
  pictureMetadatas.sort(compareNullFirstFunc);
  expect(pictureMetadatas[0].relativePath).toBe('d');
  expect(pictureMetadatas[1].relativePath).toBe('b');
  expect(pictureMetadatas[2].relativePath).toBe('c');
  expect(pictureMetadatas[3].relativePath).toBe('a');

  // expect(timeTaken).not.toBe(null);
  // expect((timeTaken as Date).toISOString()).toEqual('2018-01-22:16:29:03.000Z');
});

describe('PictureMetadata', () => {
  test('getLocation', () => {
    // example: 40°25'58.332"N 7°51'2.682"E -> 40.432870, 7.850745
    const exif = {
      GPSLatitude: ['40/1', '25/1', '58332/1000'],
      GPSLatitudeRef: 'N',
      GPSLongitude: ['7/1', '51/1', '2682/1000'],
      GPSLongitudeRef: 'E',
      GPSMapDatum: 'WGS-84',
    } as ExifData;

    const metadata = new PictureMetadata('', '', 0, exif, {height: 200, width: 200});
    const location = metadata.getLocation();
    if (location === null) {
      throw new Error('location should not be null');
    }
    expect(location.lat).toBe(40.43287);
    expect(location.long).toBe(7.850745);
  });
});
