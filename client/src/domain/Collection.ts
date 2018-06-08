import { PictureMetadata } from './PictureMetadata';

export const CollectionTypeFolder = 'folder';

export type CollectionType = 'folder';

export type ManualCollection = {
    id: number;
} & Collection;

export interface Collection {
  name: string;
  type: CollectionType;
  hashes: string[];
}

export function extractFolderCollectionsFromPicturesMetadatas(picturesMetadatas: PictureMetadata[]) {
  const collectionsMap = new Map<string, string[]>();
  picturesMetadatas.forEach((pictureMetadata) => {
    const filepathFragments = pictureMetadata.relativeFilePath.split('/');
    filepathFragments.splice(filepathFragments.length - 1, 1);
    filepathFragments.splice(0, 1);
    for (let i = 0; i < filepathFragments.length; i++) {
      const folder = filepathFragments.slice(0, i + 1).join('/');
      if (folder === '') {
        continue;
      }
      const picturesMetadataList = collectionsMap.get(folder) || [];
      picturesMetadataList.push(pictureMetadata.hashValue);
      collectionsMap.set(folder, picturesMetadataList);
    }
  });
  const collectionsList: Collection[] = [];
  collectionsMap.forEach((hashes, name) => {
    collectionsList.push({
      hashes,
      name,
      type: CollectionTypeFolder,
    });
  });
  return collectionsList;
}
