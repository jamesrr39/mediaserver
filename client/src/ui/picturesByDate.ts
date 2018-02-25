import { PictureGroup, PictureGroups } from './pictureGroup';
import { PictureMetadata } from '../domain/pictureMetadata';
import { TimezonelessDate } from '../domain/timezonelessDate';

const UNKNOWN_DATE_KEY = "Unknown Date";

const dateFormatOptionsWithYear = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' };

const dateFormatOptionsWithoutYear = { weekday: 'short', month: 'short', day: 'numeric' };

const thisYear = new Date().getFullYear();

type LocalDateTimestamp = number;

type PictureInDateObject = {
    localDateTimestamp: LocalDateTimestamp,
    picturesMetadata: PictureMetadata[]
}

export class PicturesByDate implements PictureGroups {

    private picturesInDates: PicturesInDate[] = [];

    constructor(pictureMetadatas: PictureMetadata[]) {
        const datePictureMap = new Map<LocalDateTimestamp, PictureMetadata[]>();

        // put into a map by Timestamp from TimezonelessDate
        pictureMetadatas.forEach(pictureMetadata => {
            let dateTaken = pictureMetadata.getDateTaken();
            let timestampTaken = (dateTaken) ? dateTaken.toDate().getTime() : 0;

            if (!datePictureMap.get(timestampTaken)){
                datePictureMap.set(timestampTaken, [pictureMetadata]);
            } else {
                datePictureMap.get(timestampTaken).push(pictureMetadata);
            }
        });

        const picturesInDateObjects: PictureInDateObject[] = [];

        datePictureMap.forEach((picturesMetadata, localDateTimestamp)=>{
            picturesInDateObjects.push({
              localDateTimestamp,
              picturesMetadata
            });

            pictureMetadatas.sort((a, b) => {
                let aDate = a.getDateTimeTaken(),
                    bDate = b.getDateTimeTaken();

                if (aDate === bDate){
                    return 0;
                }

                return (aDate < bDate) ? 1 : -1;
            })
        });

        picturesInDateObjects.sort((a, b) => {
            if (a.localDateTimestamp === b.localDateTimestamp) {
                return 0;
            }
            return (a.localDateTimestamp < b.localDateTimestamp) ? 1 : -1;
        });

        this.picturesInDates = picturesInDateObjects.map((picturesInDateObject) => {

            let dateString: string
            if (picturesInDateObject.localDateTimestamp === 0){
                dateString = UNKNOWN_DATE_KEY;
            } else {
                let date = new Date(picturesInDateObject.localDateTimestamp);
                const timezonelessDate = new TimezonelessDate(date.getFullYear(), date.getMonth(), date.getDate());

                const dateFormatOptions = (date.getFullYear() === thisYear) ? dateFormatOptionsWithoutYear : dateFormatOptionsWithYear;
                dateString = date.toLocaleDateString(window.navigator.language, dateFormatOptions);
            }

            return new PicturesInDate(dateString, picturesInDateObject.picturesMetadata)
        });
    }

    pictureGroups(): PictureGroup[] {
        return this.picturesInDates;
    }

}


export class PicturesInDate implements PictureGroup {

    constructor(private dateString: string, private picturesMetadatas: PictureMetadata[]){}

    groupName(): string {
        return this.dateString;
    }
    pictureMetadatas(): PictureMetadata[]{
        return this.picturesMetadatas
    }

}
