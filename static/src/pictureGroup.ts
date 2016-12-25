import { PictureMetadata } from './pictureMetadata';

export interface PictureGroup {
    groupName(): string
    pictureMetadatas(): PictureMetadata[]
}

export interface PictureGroups {
    pictureGroups(): PictureGroup[]
}