import * as React from 'react';
import { Chart } from 'chart.js';
import { Record, getSpeedsFromRecords } from '../../domain/FitTrack';
import { Time } from '../../util/time';

type Props = {
    trackRecords: Record[];
};

const colors = {
    blue: 'rgb(54, 162, 235)',
    lightBlue: 'rgb(118, 166, 204)',
};

const intervalDistanceSeconds = 20;

type ComponentState = {
    highestPace: number,
    lowestPace: number,
};

export default class SpeedChart extends React.Component<Props, ComponentState> {
    state = {
        highestPace: Number.MAX_VALUE,
        lowestPace: 0,
    };

    private chart?: Chart;

    render() {
        return (
            <>
                <label>Cap highest pace at<input type="number" onChange={event => {
                    const highestPace = parseFloat(event.target.value);
                    this.setState(state => ({
                        ...state,
                        highestPace
                    }));
                }}/></label>
                <label>Cap lowest pace at<input type="number" onChange={event => {
                    const lowestPace = parseFloat(event.target.value);
                    this.setState(state => ({
                        ...state,
                        lowestPace
                    }));
                }}/></label>
                <canvas ref={el => this.renderChart(el)} />
            </>
        );
    }

    private renderChart(el: HTMLCanvasElement|null) {
        if (!el) {
            return;
        }

        if (this.chart) {
            this.chart.destroy();
            this.chart = undefined;
        }

        const {trackRecords} = this.props;

        const ctx = el.getContext('2d');
        if (!ctx) {
            return;
        }

        const speeds = getSpeedsFromRecords(trackRecords, intervalDistanceSeconds);
        if (speeds.length === 0) {
            return;
        }

        const points = speeds.map(speedWithTime => {
            const {
                startTimeThroughSeconds,
                endTimeThroughSeconds,
                startDistanceMetres,
                endDistanceMetres,
                speedMetresPerSecond
            } = speedWithTime;
            const middleTimeThroughSeconds = Math.round(
                (startTimeThroughSeconds + endTimeThroughSeconds) / 2
            );
            const middleDistanceMetres = Math.round(
                (startDistanceMetres + endDistanceMetres) / 2
            );

            return {
                middleTimeThroughSeconds,
                middleDistanceMetres,
                speedMetresPerSecond,
            };
        });

        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: points.map(point => {
                    return `${
                        new Time(point.middleTimeThroughSeconds).toString()
                    }, ${
                        (point.middleDistanceMetres / 1000).toFixed(2)
                    }km`;
                }),
                datasets: [{
                    label: 'Speed (Metres per second)',
                    backgroundColor: colors.lightBlue,
                    borderColor: colors.blue,
                    data: points.map(point => {
                        const {speedMetresPerSecond, middleTimeThroughSeconds} = point;

                        return {
                            x: middleTimeThroughSeconds,
                            y: speedMetresPerSecond,
                        };
                    }),
                }, {
                    label: 'Pace (Minutes per kilometer)',
                    backgroundColor: colors.lightBlue,
                    borderColor: colors.blue,
                    data: points.map(point => {
                        const {speedMetresPerSecond, middleTimeThroughSeconds} = point;
                        const {highestPace, lowestPace} = this.state;

                        let pace = (1 / speedMetresPerSecond) * 1000 / 60;

                        if (highestPace && pace > highestPace) {
                            pace = highestPace;
                        }

                        if (lowestPace && pace < lowestPace) {
                            pace = lowestPace;
                        }

                        return {
                            x: middleTimeThroughSeconds,
                            y: pace.toFixed(2),
                        };
                    }),
                }],
            },
            options: {
                scales: {
                    yAxes: [{
                        ticks: {
                            beginAtZero: true
                        },
                    }],
                },
            },
        });
    }
}
