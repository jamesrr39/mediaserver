import { extractFolderCollectionsFromPicturesMetadatas } from '../CollectionsListingComponent';
import { PictureMetadata } from '../../../domain/PictureMetadata';

test('extractFolderCollectionsFromPicturesMetadatas', () => {
  const picturesMetadatas = [{
    relativeFilePath: '/IMG1.jpg',
    hashValue: 'a',
  } as PictureMetadata, {
    relativeFilePath: '/uploads/2000-08-01/IMG2.jpg',
    hashValue: 'b',
  } as PictureMetadata];

  const collections = extractFolderCollectionsFromPicturesMetadatas(picturesMetadatas);
  expect(collections.length).toBe(2);

  expect(collections[0]).toEqual({name: 'uploads', hashes: ['b'], type: 'folder'});
  expect(collections[1]).toEqual({name: 'uploads/2000-08-01', hashes: ['b'], type: 'folder'});
});
