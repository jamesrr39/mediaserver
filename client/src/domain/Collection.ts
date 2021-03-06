import { MediaFile } from './MediaFile';

export enum CollectionType {
  Folder = 'folder',
  Custom = 'custom',
}

export interface Collection {
  name: string;
  type: CollectionType;
  fileHashes: string[];
  identifier(): string;
}

export class FolderCollection implements Collection {
  public readonly type = CollectionType.Folder;
  constructor(
    public readonly name: string,
    public readonly fileHashes: string[],
  ) {}
  identifier() {
    return this.name;
  }
}

export class CustomCollection implements Collection {
  public readonly type = CollectionType.Custom;
  constructor(
    public readonly id: number,
    public readonly name: string,
    public readonly fileHashes: string[],
  ) {}
  identifier() {
    return `${this.id}-${this.name}`;
  }
}

export function extractFolderCollectionsFrommediaFiles(mediaFiles: MediaFile[]) {
  const collectionsMap = new Map<string, string[]>();
  mediaFiles.forEach((mediaFile) => {
    const filepathFragments = mediaFile.relativePath.split('/');
    filepathFragments.splice(filepathFragments.length - 1, 1);
    filepathFragments.splice(0, 1);
    for (let i = 0; i < filepathFragments.length; i++) {
      const folder = filepathFragments.slice(0, i + 1).join('/');
      if (folder === '') {
        continue;
      }
      const picturesMetadataList = collectionsMap.get(folder) || [];
      picturesMetadataList.push(mediaFile.hashValue);
      collectionsMap.set(folder, picturesMetadataList);
    }
  });
  const collectionsList: Collection[] = [];
  collectionsMap.forEach((fileHashes, name) => {
    collectionsList.push(new FolderCollection(
      name,
      fileHashes,
    ));
  });
  return collectionsList;
}
