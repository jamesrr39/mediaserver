import * as React from 'react';
// import * as d3 from 'd3';

type Props = {
    points: PathPoint[],
    k: string,
};

const styles = {
    line: {
        fill: 'rgb(0,0,255)', 
        strokeWidth: 1,
        stroke: 'rgb(0,0,0)',
    }
};

type PathPoint = {
    x: number, // between 0 and 1
    y: number, // between 0 and 1
};

// https://www.w3schools.com/graphics/svg_path.asp
function buildSVGPathString(svgHeight: number, svgWidth: number, points: PathPoint[]) {
    const instructions = [`M0 ${svgHeight}`];

    points.forEach((point) => {
        const y = Math.round(svgHeight - (point.y * svgHeight));
        const x = Math.round(point.x * svgWidth);

        instructions.push(`L${x} ${y}`);
    });

    const lastX = points[points.length - 1].x * svgWidth;

    instructions.push(`L${lastX} ${svgHeight} Z`);
    return instructions.join(' ');
}

export default class SpeedChart extends React.Component<Props> {
    render() {
        const {k} = this.props;
        // https://medium.com/@mautayro/d3-react-and-using-refs-e25b9a817a43
        // const refCb = (el: SVGElement | null) => {
        //     if (!el) {
        //         return;
        //     }

        //     console.log(el, d3);
        //     const chart = d3.select(el);
        //     console.log(chart);
        //     chart.selectAll('rect').data([1, 2, 2, 4, 5]);
            
        //     // const data = [1, 2, 3, 2, 5];
        //     // chart.data(data);
        // };

        const height = 200;
        const width = 760;

        return (
            <svg width={width} height={height} key={k} >
                <g>
                <path key={k}
                    style={styles.line}
                    d={buildSVGPathString(height, width, this.props.points)}
                />
                </g>
            </svg>
            );
    }
}