import { PictureMetadata } from '../PictureMetadata';
import { extractFolderCollectionsFromPicturesMetadatas } from '../Collection';

test('extractFolderCollectionsFromPicturesMetadatas', () => {
  const mockSize = {height: 200, width: 200};

  const picturesMetadatas = [
    new PictureMetadata('a', '/IMG1.jpg', 0, null, mockSize),
    new PictureMetadata('b', '/uploads/2000-08-01/IMG2.jpg', 0, null, mockSize),
  ];

  const collections = extractFolderCollectionsFromPicturesMetadatas(picturesMetadatas);
  expect(collections.length).toBe(2);

  expect(collections[0]).toEqual({name: 'uploads', fileHashes: ['b'], type: 'folder'});
  expect(collections[1]).toEqual({name: 'uploads/2000-08-01', fileHashes: ['b'], type: 'folder'});
});
