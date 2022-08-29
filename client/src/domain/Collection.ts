import { MediaFile } from "./MediaFile";

export enum CollectionType {
  Folder = "folder",
  Custom = "custom",
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
    public readonly fileHashes: string[]
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
    public readonly fileHashes: string[]
  ) {}
  identifier() {
    return `${this.id}-${this.name}`;
  }
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      fileHashes: this.fileHashes,
    };
  }
}
// CustomCollection.prototype.toJSON() {
//   return {attr: this.getAttr()}; // everything that needs to get stored
// };
// MyClass.fromJSON = function(obj) {
//   if (typeof obj == "string") obj = JSON.parse(obj);
//   var instance = new MyClass;
//   instance._attr = obj.attr;
//   return instance;
// };

export function extractFolderCollectionsFrommediaFiles(
  mediaFiles: MediaFile[]
) {
  const collectionsMap = new Map<string, string[]>();
  mediaFiles.forEach((mediaFile) => {
    const filepathFragments = mediaFile.relativePath.split("/");
    filepathFragments.splice(filepathFragments.length - 1, 1);
    filepathFragments.splice(0, 1);
    for (let i = 0; i < filepathFragments.length; i++) {
      const folder = filepathFragments.slice(0, i + 1).join("/");
      if (folder === "") {
        continue;
      }
      const picturesMetadataList = collectionsMap.get(folder) || [];
      picturesMetadataList.push(mediaFile.hashValue);
      collectionsMap.set(folder, picturesMetadataList);
    }
  });
  const collectionsList: Collection[] = [];
  collectionsMap.forEach((fileHashes, name) => {
    collectionsList.push(new FolderCollection(name, fileHashes));
  });
  return collectionsList;
}

export function findCollectionFromTypeAndName(
  mediaFiles: MediaFile[],
  collectionType: CollectionType,
  collectionIdentifier: string,
  customCollections: CustomCollection[]
) {
  switch (collectionType) {
    case CollectionType.Folder:
      const collection = extractFolderCollectionsFrommediaFiles(
        mediaFiles
      ).find(
        (currentCollection) => currentCollection.name === collectionIdentifier
      );
      return collection;
    case CollectionType.Custom:
      return customCollections.find(
        (customCollection) =>
          customCollection.identifier() === collectionIdentifier
      );
    default:
      throw new Error(`unrecognised type ${collectionType}`);
  }
}
