import { TimezonelessDate } from './timezonelessDate'


export class PictureMetadata {

    constructor(public hashValue: string, public relativeFilePath: string, public fileSizeBytes: number, public exif: Map<string, any>) { }
    // DateTime":"2014:07:30 21:19:54","DateTimeDigitized":"2014:07:30 21:19:54","DateTimeOriginal
    getDateTimeTaken(): Date {
        if (!this.exif) {
            return null;
        }

		const exifDateTaken = (this.exif.get("DateTime") as string) || (this.exif.get("DateTimeDigitized") as string) || (this.exif.get("DateTimeOriginal") as string);
        if (!exifDateTaken) {
            return null;
        }

		const fragments = exifDateTaken.replace(" ", ":").split(":");
        return new Date(
            parseInt(fragments[0], 10), // year
            parseInt(fragments[1], 10) -1, // month
            parseInt(fragments[2], 10), // day
            parseInt(fragments[3], 10), // hour
            parseInt(fragments[4], 10), // minute
            parseInt(fragments[5], 10) // second
        );
    }
    getDateTaken(): TimezonelessDate {
      let dateTime = this.getDateTimeTaken();
      if (!dateTime){
          return null;
      }

  		return new TimezonelessDate(dateTime.getFullYear(), dateTime.getMonth(), dateTime.getDate());
  	}
    getFileName(): string {
      if (!this.relativeFilePath){
          return "no name";
      }
      const indexOfLastSlash = this.relativeFilePath.lastIndexOf("/") + 1;
      return this.relativeFilePath.substring(indexOfLastSlash);
    }
}
