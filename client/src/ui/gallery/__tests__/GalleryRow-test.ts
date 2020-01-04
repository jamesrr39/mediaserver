import { filesToRows } from '../GalleryRow';
import { MediaFileGroup } from '../../../domain/MediaFileGroup';
import { PictureMetadata } from '../../../domain/PictureMetadata';
import { FitTrack } from '../../../domain/FitTrack';

test('filesToRows', () => {
    const rowSizePx = 700;
    const activityBounds = {
        latMin: 0,
        latMax: 0,
        longMin: 0,
        longMax: 0,
    };

    const mediaFileGroups: MediaFileGroup[] = [{
        // one group in row, 2 files
        name: '1970-01-01',
        value: new Date('1970-01-01').getTime(),
        mediaFiles: [
            new PictureMetadata('', '', 0, [], null, {width: 1024, height: 768}, undefined),
            new FitTrack('', '', 0, [], new Date(0), new Date(0), '', '', 0, activityBounds, undefined),
        ],
    }, {
        // two groups in row, 1 picture in this group
        name: '1970-01-02',
        value: new Date('1970-01-02').getTime(),
        mediaFiles: [
            new PictureMetadata('', '', 0, [], null, {width: 1024, height: 768}, undefined),
        ],
    }, {
        // two groups in row, 2 pictures in this group
        name: '1970-01-03',
        value: new Date('1970-01-03').getTime(),
        mediaFiles: [
            new PictureMetadata('', '', 0, [], null, {width: 768, height: 1024}, undefined),
            new PictureMetadata('', '', 0, [], null, {width: 768, height: 1024}, undefined),
        ],
    }, {
        // one group in row, 4 pictures in this group
        name: '1970-01-04',
        value: new Date('1970-01-04').getTime(),
        mediaFiles: [
            new PictureMetadata('', '', 0, [], null, {width: 1024, height: 768}, undefined),
            new PictureMetadata('', '', 0, [], null, {width: 1024, height: 768}, undefined),
            new PictureMetadata('', '', 0, [], null, {width: 1024, height: 768}, undefined),
            new PictureMetadata('', '', 0, [], null, {width: 1024, height: 768}, undefined),
        ],        
    }];
    const rows = filesToRows(rowSizePx, mediaFileGroups);
    rows.sort((a, b) => {
        return a.groups[0].name < b.groups[0].name ? 1 : -1;
    });

    expect(rows).toHaveLength(3);

    expect(rows[0].groups).toHaveLength(1);
    expect(rows[0].groups[0].name).toBe('1970-01-04');
    expect(rows[0].groups[0].mediaFiles).toHaveLength(4);

    expect(rows[1].groups).toHaveLength(2);
    expect(rows[1].groups[0].name).toBe('1970-01-03');
    expect(rows[1].groups[0].mediaFiles).toHaveLength(2);
    expect(rows[1].groups[1].name).toBe('1970-01-02');
    expect(rows[1].groups[1].mediaFiles).toHaveLength(1);

    expect(rows[2].groups).toHaveLength(1);
    expect(rows[2].groups[0].name).toBe('1970-01-01');
    expect(rows[2].groups[0].mediaFiles).toHaveLength(2);
});
