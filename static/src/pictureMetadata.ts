
export class PictureMetadata {
    
    constructor(public hashValue: string, public relativeFilePath: string, public fileSizeBytes: number, public exif: Map<string, any>){}
    dateTaken(): Date {
        if (!this.exif){
            return null;
        }
        
        let exifDateTaken = this.exif.get("DateTime") as string; // todo other exif dates
        if (!exifDateTaken){
            return null;
        }
        
        let fragments = exifDateTaken.substring(0, exifDateTaken.indexOf(" ")).split(":");
        return new Date(parseInt(fragments[0], 10), parseInt(fragments[1], 10), parseInt(fragments[2], 10));
        
    }
}