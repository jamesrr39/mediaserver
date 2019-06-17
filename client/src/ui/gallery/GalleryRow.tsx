import * as React from 'react';
import { MediaFile } from '../../domain/MediaFile';
import { getSizeForThumbnail, Thumbnail } from '../Thumbnail';
import { Observable } from '../../util/Observable';
import { Size } from '../../domain/Size';
import { MediaFileGroup } from '../../domain/MediaFileGroup';
import { Link } from 'react-router-dom';

export type Row = {
    groups: GroupWithSizes[],
};

const styles = {
    row: {
        display: 'flex',
        justifyContent: 'space-between',
        padding: '10px',
        margin: '10px',
    },
    pictureContainer: {
        display: 'flex'
    },
};

export type BuildLinkFunc = (mediaFile: MediaFile) => string;

type MediaFileWithSize = {
    mediaFile: MediaFile,
    size: Size,
};

type GroupWithSizes = {
    name: string,
    mediaFiles: MediaFileWithSize[],
};

type Props = {
    row: Row;
    scrollObservable: Observable<{}>;
    onClickThumbnail?: (mediaFile: MediaFile) => void;
    buildLink?: BuildLinkFunc;
};

export class GalleryRow extends React.Component<Props> {
    render() {
        const {
            row,
            scrollObservable,
            onClickThumbnail,
            buildLink,
        } = this.props;

        const {groups} = row;

        return (
            <div style={styles.row}>
            {groups.map((group, index) => {
                return (
                    <div key={index}>
                        <h4>{group.name}</h4>
                        <div style={styles.pictureContainer}>
                        {group.mediaFiles.map((mediaFileWithSize, index) => {
                            const {mediaFile, size} = mediaFileWithSize;

                            const thumbnailProps = {
                                size,
                                mediaFile,
                                scrollObservable,
                            };

                            let thumbnail = <Thumbnail key={index} {...thumbnailProps} />;

                            if (buildLink) {
                                thumbnail = (
                                    <Link key={index} to={buildLink(mediaFile)}>
                                        {thumbnail}
                                    </Link>
                                );
                            }

                            if (onClickThumbnail) {
                                const onClickThumbnailCb = (event: React.MouseEvent<HTMLAnchorElement>) => {
                                    event.preventDefault();
                                    onClickThumbnail(mediaFile);
                                };

                                thumbnail = <a href="#" onClick={onClickThumbnailCb}>{thumbnail}</a>;
                            }

                            return thumbnail;
                        })}
                        </div>
                    </div>
                );
            })}
            </div>
        );
    }
}

export function filesToRows(rowSizePx: number, mediaFileGroups: MediaFileGroup[]): Row[] {
    const rows: Row[] = [];
    let currentRow: GroupWithSizes[] = [];
    let widthSoFar = 0;
    const reduceFunc = (prev: number, curr: MediaFileWithSize) => {
        return prev + curr.size.width;
    };
    const groupSortingFunc = (a: GroupWithSizes, b: GroupWithSizes) => {
        return a.name < b.name ? 1 : -1;
    };

    mediaFileGroups.forEach(group => {
        const thumbnails = group.mediaFiles.map(mediaFile => ({size: getSizeForThumbnail(mediaFile), mediaFile}));

        const groupWidth = thumbnails.reduce(reduceFunc, 0);

        const thumbnailGroup = {mediaFiles: thumbnails, name: group.name};

        const shouldBeInNewRow = (groupWidth + widthSoFar) >= rowSizePx;

        if (shouldBeInNewRow) {
            // group is as wide or wider than a row
            widthSoFar = 0;

            currentRow.sort(groupSortingFunc);
            rows.push({groups: currentRow});

            currentRow = [];
            if (groupWidth >= rowSizePx) {
                rows.push({groups: [thumbnailGroup]});
            } else {
                currentRow.push(thumbnailGroup);
                widthSoFar = groupWidth;
            }
            return;
        }

        // add to existing row

        widthSoFar += groupWidth;
        currentRow.push(thumbnailGroup);
    });

    if (currentRow.length !== 0) {
        rows.push({groups: currentRow});
    }

    return rows;
}
