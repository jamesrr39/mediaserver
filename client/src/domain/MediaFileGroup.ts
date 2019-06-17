import { MediaFile } from './MediaFile';

export type MediaFileGroup = {
    name: string;
    mediaFiles: MediaFile[];
};

export function mediaFilesToDateGroups(mediaFiles: MediaFile[]) {
    const groupsMap = new Map<string, MediaFile[]>();
    mediaFiles.forEach(mediaFile => {
        const timeTaken = mediaFile.getTimeTaken();
        let dateAsString = 'unknown';
        if (timeTaken) {
            dateAsString = `${timeTaken.getFullYear()}-${timeTaken.getMonth() + 1}-${timeTaken.getDate()}`;
        }

        let group = groupsMap.get(dateAsString);
        if (!group) {
            group = [];
            groupsMap.set(dateAsString, group);
        }
        group.push(mediaFile);
    });

    return groupsMap;
}

export function groupsMapToGroups(groupsMap: Map<string, MediaFile[]>) {
    const groups: MediaFileGroup[] = [];
    groupsMap.forEach((mediaFiles, name) => {
        groups.push({name, mediaFiles});
    });
    return groups;
}
