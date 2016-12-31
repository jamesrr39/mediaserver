export class TimezonelessDate {
    /**
     * month is 0-based, like the navite js month
     */
    constructor(private year: number, private month: number, private day: number){}
    toISOString(): string {
        let yearStr = this.year + "";
        while (yearStr.length < 4){
            yearStr = "0" + yearStr;
        }
        
        let monthStr = (this.month +1) + "";
        while (monthStr.length < 2){
            monthStr = "0" + monthStr;
        }
        
        let dayStr = this.day + "";
        while (dayStr.length < 2){
            dayStr = "0" + dayStr;
        }
        
        return yearStr + "-" + monthStr + "-" + dayStr;
        
    }
    toDate(): Date {
        return new Date(this.year, this.month, this.day);
    }
}