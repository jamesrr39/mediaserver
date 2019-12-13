
export class Time {
    public readonly hours: number;
    public readonly minutes: number;
    public readonly seconds: number;

    constructor(timeSeconds: number) {
        this.hours = Math.floor(timeSeconds / 3600);
        let remainingSeconds = timeSeconds - (this.hours * 3600);
        this.minutes = Math.floor(remainingSeconds / 60);
        remainingSeconds = remainingSeconds - (this.minutes * 60);
        this.seconds = remainingSeconds;
    }

    public toString() {
        let s = '';
        if (this.hours) {
            s += `${this.hours}h `;
        }
        if (this.minutes) {
            s += `${this.minutes}m `;
        }
        s += `${this.seconds}s`;

        return s;
    }
}
