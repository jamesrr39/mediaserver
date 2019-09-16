import { MediaFile } from './MediaFile';

export type MediaFileGroup = {
    name: string;
    mediaFiles: MediaFile[];
    value: number; // higher = sorted first
};

export function mediaFilesToDateGroups(mediaFiles: MediaFile[]) {
    const groupsMap = new Map<string, {mediaFiles: MediaFile[], value: number}>();
    mediaFiles.forEach(mediaFile => {
        const timeTaken = mediaFile.getTimeTaken();
        let dateAsString = 'unknown';
        if (timeTaken) {
            dateAsString = `${timeTaken.getFullYear()}-${timeTaken.getMonth() + 1}-${timeTaken.getDate()}`;
        }

        let group = groupsMap.get(dateAsString);
        if (!group) {
            const startOfDate = timeTaken ? timeTaken.getTime() : 0;
            group = {mediaFiles: [], value: startOfDate};
            groupsMap.set(dateAsString, group);
        }
        group.mediaFiles.push(mediaFile);
    });

    return groupsMap;
}

export function groupsMapToGroups(groupsMap: Map<string, {value: number, mediaFiles: MediaFile[]}>) {
    const groups: MediaFileGroup[] = [];
    groupsMap.forEach((group, name) => {
        const {mediaFiles, value} = group;
        groups.push({name, mediaFiles, value});
    });
    return groups;
}
