const rspack = require('@rspack/core');
const Router = require("./e2e/router");
// const watchFile = require('./scripts/ymlToStr');

globalThis.process.env.RUNNER = 'rspack';

/**
 * @type {import('@rspack/core').Configuration}
 */
module.exports = {
  entry: {
    main: './e2e/index.tsx',
  },
  plugins: [
    new rspack.HtmlRspackPlugin({
      title: "MSA parser engine",
      template: './e2e/index.html',
    })
  ],
  devServer: {
    setupMiddlewares: (middlewares) => {
      // watchFile();
      middlewares.unshift(Router);
      return middlewares;
    }
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        exclude: [/node_modules/],
        loader: 'builtin:swc-loader',
        options: {
          jsc: {
            parser: {
              syntax: 'typescript',
            },
          },
        },
        type: 'javascript/auto',
      }
    ],
  },
};