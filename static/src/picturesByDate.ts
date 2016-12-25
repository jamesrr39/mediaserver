import { PictureGroup, PictureGroups } from './pictureGroup';
import { PictureMetadata } from './pictureMetadata';

const UNKNOWN_DATE_KEY = "Unknown";

export class PicturesByDate implements PictureGroups {
    
    picturesInDates: PicturesInDate[] = [];
    
    constructor(pictureMetadatas: PictureMetadata[]) {
        var datePictureMap = new Map<string, PictureMetadata[]>(),
        self = this;
        
        pictureMetadatas.forEach(pictureMetadata => {
            let dateTaken = pictureMetadata.dateTaken();
            let dateString = (dateTaken === null) ? UNKNOWN_DATE_KEY : dateTaken.toISOString().substring(0, dateTaken.toISOString().indexOf("T"))
            
            if (!datePictureMap.get(dateString)){
                datePictureMap.set(dateString, [pictureMetadata])
            } else {
                datePictureMap.get(dateString).push(pictureMetadata);
            }
        });
        
        datePictureMap.forEach((pictureMetadatas, dateString)=>{
            self.picturesInDates.push(new PicturesInDate(dateString, pictureMetadatas));
        })
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