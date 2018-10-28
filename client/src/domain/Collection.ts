import { PictureMetadata } from './PictureMetadata';

export enum CollectionType {
  Folder = 'folder',
  Custom = 'custom',
}

export interface Collection {
  name: string;
  type: CollectionType;
  fileHashes: string[];
  identifier(): string;
  // getIdFromIdentifier(identifier: string): number;
  // getNameFromIdentifier(identifier: string): string;
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
  // getNameFromIdentifier(identifier: string): string {
  //   return this.
  // }
  // getIdFromIdentifier(identifier: string): number {
  //   const indexOfDash = identifier.indexOf('-');
  //   return parseInt(identifier.substring(0, indexOfDash), 10);
  // }
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
  // getNameFromIdentifier(identifier: string): string {
  //   const indexOfDash = identifier.indexOf('-');
  //   return identifier.substring(indexOfDash + 1);
  // }
  // getIdFromIdentifier(identifier: string): number {
  //   const indexOfDash = identifier.indexOf('-');
  //   return parseInt(identifier.substring(0, indexOfDash), 10);
  // }
}

export function extractFolderCollectionsFromPicturesMetadatas(picturesMetadatas: PictureMetadata[]) {
  const collectionsMap = new Map<string, string[]>();
  picturesMetadatas.forEach((pictureMetadata) => {
    const filepathFragments = pictureMetadata.relativePath.split('/');
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
  collectionsMap.forEach((fileHashes, name) => {
    collectionsList.push(new FolderCollection(
      name,
      fileHashes,
    ));
  });
  return collectionsList;
}
