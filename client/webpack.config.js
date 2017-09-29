module.exports = {
  entry: './src/main.ts',
  output: {
    filename: 'dist/bundle.js'
  },
  resolve: {
    extensions: ['.webpack.js', '.web.js', '.ts', '.js']
  },
  module: {
    loaders: [
      { test: /\.ts$/, loader: 'ts-loader' }
    ]
  },
  devtool: 'source-map'
};

/*module.exports = {
    entry: 'src/main.ts',
    output: {
        filename: 'dist/bundle.js'
    },
    resolve: {
        extensions: ['.ts', '.webpack.js', '.web.js', '.js']
    },
    module: {
        loaders: [
            {test: /\.ts$/, loader: 'ts-loader'}
        ]
    },
    devtool: "source-map"
};
*/
