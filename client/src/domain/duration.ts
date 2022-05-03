const strForValue = (value: number, unitName: string) => {
  switch (value) {
    case 0:
      return "";
    case 1:
      return `1 ${unitName} `;
    default:
      return `${value} ${unitName}s `;
  }
};

export class Duration {
  constructor(
    private readonly startTime: Date,
    private readonly endTime: Date
  ) {}

  getDisplayString() {
    const durationSeconds = this.getSeconds();
    const hours = Math.floor(durationSeconds / 3600);
    const minutes = Math.floor(durationSeconds / 60) - hours * 60;
    const seconds = Math.floor(durationSeconds) - (hours * 3600 + minutes * 60);

    let s = "";
    s += strForValue(hours, "hour");
    s += strForValue(minutes, "minute");
    s += strForValue(seconds, "second");

    return s;
  }

  getSeconds() {
    return (this.endTime.getTime() - this.startTime.getTime()) / 1000;
  }
}
