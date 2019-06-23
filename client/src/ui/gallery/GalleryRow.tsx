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

export const GALLERY_GROUP_LEFT_MARGIN_PX = 50;

export const GALLERY_FILE_LEFT_MARGIN_PX = 10;

const styles = {
    row: {
        display: 'flex',
        // justifyContent: 'space-between',
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
                const style: React.CSSProperties = {};
                if (index !== 0) {
                    style.marginLeft = `${GALLERY_GROUP_LEFT_MARGIN_PX}px`;
                }
                return (
                    <div key={index} style={style}>
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

                            const leftPx = index === 0 ? 0 : GALLERY_FILE_LEFT_MARGIN_PX;
                            const style = {
                                marginLeft: `${leftPx}px`,
                                flexWrap: 'wrap' as 'wrap',
                            };
                            return <div style={style}>{thumbnail}</div>;
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
    const reduceFunc = (prev: number, curr: MediaFileWithSize, index: number) => {
        const leftMargin = (index === 0) ? 0 : GALLERY_FILE_LEFT_MARGIN_PX;
        return prev + curr.size.width + leftMargin;
    };
    const groupSortingFunc = (a: GroupWithSizes, b: GroupWithSizes) => {
        return a.name < b.name ? 1 : -1;
    };

    mediaFileGroups.forEach(group => {
        const thumbnails = group.mediaFiles.map(mediaFile => ({size: getSizeForThumbnail(mediaFile), mediaFile}));

        const groupWidth = thumbnails.reduce(reduceFunc, 0);
        let groupWidthWithMargin = groupWidth;
        if (widthSoFar !== 0) {
            groupWidthWithMargin += GALLERY_GROUP_LEFT_MARGIN_PX;
        }

        const thumbnailGroup = {mediaFiles: thumbnails, name: group.name};

        const shouldBeInNewRow = (groupWidthWithMargin + widthSoFar) >= rowSizePx;

        if (shouldBeInNewRow) {
            // group can't fit in this row
            widthSoFar = 0;

            currentRow.sort(groupSortingFunc);
            rows.push({groups: currentRow});

            currentRow = [];
            if (groupWidth >= rowSizePx) {
                // group is as wide or wider than a row
                rows.push({groups: [thumbnailGroup]});
            } else {
                currentRow.push(thumbnailGroup);
                widthSoFar = groupWidth;
            }
            return;
        }

        // add to existing row
        widthSoFar += (groupWidthWithMargin);
        currentRow.push(thumbnailGroup);
    });

    if (currentRow.length !== 0) {
        rows.push({groups: currentRow});
    }

    return rows;
}
