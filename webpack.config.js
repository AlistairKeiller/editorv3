const webpack = require('webpack');

module.exports = {
  mode: 'production',
  module: {
    rules: [
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
  plugins: [new webpack.ProvidePlugin({ BrowserFS: 'browserfs' })],
};
