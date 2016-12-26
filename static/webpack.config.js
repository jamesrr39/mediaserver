 module.exports = {
     entry: './app/main.js',
     output: {
         path: './app/',
         filename: 'main.bundle.js'
     },
  resolve: {
    extensions: ['', '.webpack.js', '.web.js', '.ts', '.js']
  },
  module: {
    loaders: [
      { test: /\.ts$/, loader: 'ts-loader' }
    ]
  }
 };
