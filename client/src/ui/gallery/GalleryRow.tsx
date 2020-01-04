import * as React from 'react';
import { MediaFile } from '../../domain/MediaFile';
import Thumbnail, { getSizeForThumbnail } from '../Thumbnail';
import { Size } from '../../domain/Size';
import { MediaFileGroup } from '../../domain/MediaFileGroup';
import { Link } from 'react-router-dom';
import { Observable } from '../../util/Observable';

export type Row = {
    groups: GroupWithSizes[],
    fitsInOneLine: boolean,
};

export const GALLERY_GROUP_LEFT_MARGIN_PX = 50;

export const GALLERY_FILE_LEFT_MARGIN_PX = 10;

const styles = {
    row: {
        display: 'flex',
        padding: '10px',
        margin: '10px',
    },
};

export type SelectThumbnailEventInfo = {
    selected: boolean;
};

export type BuildLinkFunc = (mediaFile: MediaFile) => string;

type MediaFileWithSize = {
    mediaFile: MediaFile,
    size: Size,
};

interface GroupWithSizes {
    name: string;
    mediaFiles: MediaFileWithSize[];
    value: number; // higher = sorted first
}

type Props = {
    row: Row;
    scrollObservable: Observable<void>;
    resizeObservable: Observable<void>;
    onClickThumbnail?: (mediaFile: MediaFile) => void;
    buildLink?: BuildLinkFunc;
    onSelectThumbnail?: (mediaFile: MediaFile, eventInfo: SelectThumbnailEventInfo) => void;
    getRowWidth(): number;
    isThumbnailVisible(el: HTMLElement): void;
};

export class GalleryRow extends React.Component<Props> {
    render() {
        const { row } = this.props;

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
                        <div>
                            {this.renderGroup(group)}
                        </div>
                    </div>
                );
            })}
            </div>
        );
    }

    private renderGroup(group: GroupWithSizes) {
        const {
            getRowWidth,
            row,
        } = this.props;

        const rowWidth = getRowWidth();

        if (row.fitsInOneLine) {
            return group.mediaFiles.map((mediaFileWithSize, index) => {
                const leftPx = (index === 0) ? 0 : GALLERY_FILE_LEFT_MARGIN_PX;
                const style = {
                    marginLeft: `${leftPx}px`,
                };

                const thumbnail = this.mediaFileWithSizeToThumbnail(mediaFileWithSize);

                return <div key={index} style={style}>{thumbnail}</div>;
            });
        }

        let distanceThroughContainer = 0;
        const rows: MediaFileWithSize[][] = [];
        let currentRow: MediaFileWithSize[] = [];
        
        group.mediaFiles.forEach((mediaFileWithSize, index) => {
            const {size} = mediaFileWithSize;

            if (distanceThroughContainer + size.width > rowWidth) {
                rows.push(currentRow);
                currentRow = [mediaFileWithSize];
                distanceThroughContainer = size.width;
            } else {
                const leftPx = (index === 0) ? 0 : GALLERY_FILE_LEFT_MARGIN_PX;
                distanceThroughContainer += (size.width + leftPx);
                currentRow.push(mediaFileWithSize);
            }
        });

        if (currentRow.length !== 0) {
            rows.push(currentRow);
        }

        return rows.map((row, index) => {
            const rowThumbnails = row.map((mediaFileWithSize, index) => {
                const thumbnail = this.mediaFileWithSizeToThumbnail(mediaFileWithSize);
                
                const leftPx = (index === 0) ? 0 : GALLERY_FILE_LEFT_MARGIN_PX;

                const style = {
                    marginLeft: `${leftPx}px`,
                };

                return <div key={index} style={style}>{thumbnail}</div>;
            });

            const style = {
                display: 'flex',
                marginTop: (index === 0) ? 0 : '10px',
            };

            return <div key={index} style={style}>{rowThumbnails}</div>;
        });
    }

    private mediaFileWithSizeToThumbnail = (mediaFileWithSize: MediaFileWithSize) => {
        const {mediaFile, size} = mediaFileWithSize;
        const {
            buildLink, 
            onClickThumbnail, 
            onSelectThumbnail, 
            isThumbnailVisible, 
            scrollObservable, 
            resizeObservable,
        } = this.props;

        const thumbnailProps = {
            size,
            mediaFile,
            isThumbnailVisible,
            scrollObservable,
            resizeObservable,
        };

        let thumbnail = <Thumbnail {...thumbnailProps} />;

        if (buildLink) {
            thumbnail = (
                <Link to={buildLink(mediaFile)}>
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

        const wrapper = onSelectThumbnail ? 
            <>
                <input
                    type="checkbox" 
                    onChange={(event) => onSelectThumbnail(mediaFile, {selected: event.target.checked})} 
                />
                {thumbnail}
            </> : 
            thumbnail;

        return wrapper;
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
        return a.value < b.value ? 1 : -1;
    };

    mediaFileGroups.forEach(group => {
        const thumbnails = group.mediaFiles.map(mediaFile => ({size: getSizeForThumbnail(mediaFile), mediaFile}));

        const groupWidth = thumbnails.reduce(reduceFunc, 0);
        let groupWidthWithMargin = groupWidth;
        if (widthSoFar !== 0) {
            groupWidthWithMargin += GALLERY_GROUP_LEFT_MARGIN_PX;
        }

        const thumbnailGroup = {mediaFiles: thumbnails, name: group.name, value: group.value};

        const shouldBeInNewRow = (groupWidthWithMargin + widthSoFar) >= rowSizePx;

        if (shouldBeInNewRow) {
            // group can't fit in this row
            widthSoFar = 0;

            currentRow.sort(groupSortingFunc);
            rows.push({groups: currentRow, fitsInOneLine: false});

            currentRow = [];
            if (groupWidth >= rowSizePx) {
                // group is as wide or wider than a row
                const fitsInOneLine = groupWidth === rowSizePx;
                rows.push({groups: [thumbnailGroup], fitsInOneLine});
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
        rows.push({groups: currentRow, fitsInOneLine: true});
    }

    return rows;
}
