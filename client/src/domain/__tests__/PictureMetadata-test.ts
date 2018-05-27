import { PictureMetadata, createCompareTimeTakenFunc } from '../PictureMetadata';

test('createCompareTimeTakenFunc creates a sorting function based on the time the picture was taken', () => {
  const pictureMetadatas = [{
    relativeFilePath: 'a',
    exif: {
      DateTime: '2018:01:22 16:29:03',
    }
  } as PictureMetadata, {
    relativeFilePath: 'b',
    exif: {
      DateTime: '2018:01:22 17:29:03',
    }
  } as PictureMetadata, {
    relativeFilePath: 'c',
    exif: {
      DateTime: '2018:01:22 16:49:03',
    }
  } as PictureMetadata, {
    relativeFilePath: 'd',
    exif: null
  }];

  const compareFunc = createCompareTimeTakenFunc(true);
  pictureMetadatas.sort(compareFunc);
  expect(pictureMetadatas[0].relativeFilePath).toBe('b');
  expect(pictureMetadatas[1].relativeFilePath).toBe('c');
  expect(pictureMetadatas[2].relativeFilePath).toBe('a');
  expect(pictureMetadatas[3].relativeFilePath).toBe('d');

  const compareNullFirstFunc = createCompareTimeTakenFunc(false);
  pictureMetadatas.sort(compareNullFirstFunc);
  expect(pictureMetadatas[0].relativeFilePath).toBe('d');
  expect(pictureMetadatas[1].relativeFilePath).toBe('b');
  expect(pictureMetadatas[2].relativeFilePath).toBe('c');
  expect(pictureMetadatas[3].relativeFilePath).toBe('a');

  // expect(timeTaken).not.toBe(null);
  // expect((timeTaken as Date).toISOString()).toEqual('2018-01-22:16:29:03.000Z');
});
