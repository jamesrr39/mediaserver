import * as React from 'react';
import { MediaFile } from '../../domain/MediaFile';
import { getSizeForThumbnail, Thumbnail } from '../Thumbnail';
import { Observable } from '../../util/Observable';
import { Size } from '../../domain/Size';
import { Link } from 'react-router-dom';

const styles = {
    row: {
        display: 'flex',
        justifyContent: 'space-between',
    },
};

export type BuildLinkFunc = (mediaFile: MediaFile) => string;

type MediaFileWithSize = {
    mediaFile: MediaFile,
    size: Size,
};

type Props = {
    mediaFilesWithSizes: MediaFileWithSize[];
    scrollObservable: Observable<{}>;
    rowWidth: number;
    onClickThumbnail?: (mediaFile: MediaFile) => void;
    buildLink?: BuildLinkFunc;
};

const reduceFunc = (total: number, mediaFileWithSize: MediaFileWithSize) => {
    return total + mediaFileWithSize.size.width;
};

export class GalleryRow extends React.Component<Props> {
    render() {
        const {
            mediaFilesWithSizes,
            scrollObservable,
            rowWidth,
            onClickThumbnail,
            buildLink,
        } = this.props;
        const totalFilesWidth = mediaFilesWithSizes.reduce(reduceFunc, 0);
        const ratio = rowWidth / totalFilesWidth;

        return (
            <div style={styles.row}>
            {mediaFilesWithSizes.map((mediaFileWithSize, index) => {
                const {size, mediaFile} = mediaFileWithSize;

                const adjustedSize = {
                    width: Math.floor(size.width * ratio),
                    height: Math.floor(size.height * ratio),
                };

                const thumbnailProps = {
                    size: adjustedSize,
                    mediaFile,
                    scrollObservable,
                };
                
                let thumbnail = <Thumbnail key={index} {...thumbnailProps} />;

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

                return thumbnail;
            })}
            </div>
        );
    }
}

export function filesToRows(rowSizePx: number, mediaFiles: MediaFile[]) {
    const rows: MediaFileWithSize[][] = [];
    let currentRow: MediaFileWithSize[] = [];
    let widthSoFar = 0;

    mediaFiles.forEach(mediaFile => {
        const size = getSizeForThumbnail(mediaFile);

        currentRow.push({mediaFile, size});

        widthSoFar += size.width;

        if (widthSoFar < rowSizePx) {
            // not the end of the row yet, continue
            return;
        }

        // reached the end of the row, reset
        rows.push(currentRow);
        currentRow = [];
        widthSoFar = 0;
    });

    return rows;
}
