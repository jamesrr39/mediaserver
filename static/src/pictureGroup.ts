import { PictureMetadata } from './pictureMetadata';

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

//method) Array<PictureGroup>.reduce(callbackfn: (previousValue: PictureGroup, currentValue: PictureGroup, currentIndex: number, array: PictureGroup[]) => PictureGroup, initialValue?: PictureGroup): PictureGroup (+1 overload)
