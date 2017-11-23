import { PictureMetadata } from '../domain/pictureMetadata';

export interface PictureGroup {
    groupName(): string
    pictureMetadatas(): PictureMetadata[]
}

export interface PictureGroups {
    pictureGroups(): PictureGroup[]
}

export class PictureGroupHelper {
	static flattenGroups(pictureGroups: PictureGroup[]): PictureMetadata[] {
		return pictureGroups.reduce((cumulativeGroup, currentPictureGroup) => {
			return cumulativeGroup.concat(currentPictureGroup.pictureMetadatas());
		}, []);
	}
}
