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
