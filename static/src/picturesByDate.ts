import { PictureGroup, PictureGroups } from './pictureGroup';
import { PictureMetadata } from './pictureMetadata';
import { TimezonelessDate } from './timezonelessDate';

const UNKNOWN_DATE_KEY = "Unknown Date";

export class PicturesByDate implements PictureGroups {
    
    picturesInDates: PicturesInDate[] = [];
    
    constructor(pictureMetadatas: PictureMetadata[]) {
        const datePictureMap = new Map<number, PictureMetadata[]>();
        
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
        
        let picturesInDateObjects: PictureInDateObject[] = [];
        
        datePictureMap.forEach((pictureMetadatas, dateTaken)=>{            
            picturesInDateObjects.push(new PictureInDateObject(dateTaken, pictureMetadatas));
            
            pictureMetadatas.sort((a, b) => {
                let aDate = a.getDateTaken(),
                    bDate = b.getDateTaken();
                    
                if (aDate === bDate){
                    return 0;
                }
                
                return (aDate > bDate) ? 1 : -1;
            })
        });

        picturesInDateObjects.sort((a, b) => {
            if (a.timestamp === b.timestamp) {
                return 0;
            }
            return (a.timestamp < b.timestamp) ? 1 : -1;
        });
        
        this.picturesInDates = picturesInDateObjects.map((picturesInDateObject) => {
            
            let dateString: string
            if (picturesInDateObject.timestamp === 0){
                dateString = UNKNOWN_DATE_KEY;
            } else {
                let date = new Date(picturesInDateObject.timestamp);
                dateString = new TimezonelessDate(date.getFullYear(), date.getMonth(), date.getDate()).toISOString();
            }
            
            return new PicturesInDate(dateString, picturesInDateObject.picturesMetadata)
        });
    }
    
    pictureGroups(): PictureGroup[] {
        return this.picturesInDates;
    }
    
}

class PictureInDateObject {
    constructor(public timestamp: number, public picturesMetadata: PictureMetadata[]){}
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