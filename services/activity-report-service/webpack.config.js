const path = require('path')
const slsw = require('serverless-webpack')

module.exports = {
  entry: slsw.lib.entries,
  resolve: {
    extensions: ['.js', '.json', '.ts', '.tsx'],
    mainFields: ['main'],
    symlinks: true,
  },
  output: {
    libraryTarget: 'commonjs2',
    path: path.resolve(__dirname, '.webpack'),
    filename: '[name].js',
  },
  target: 'node',
  module: {
    rules: [
      {
        test: /\.ts(x?)$/,
        use: [
          {
            loader: 'ts-loader',
            options: {
              transpileOnly: true,
            },
          },
        ],
      },
    ],
  },
}