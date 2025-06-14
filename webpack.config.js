const path = require('path');
const webpack = require('webpack');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const Dotenv = require('dotenv-webpack');

module.exports = {
    entry: {
        app: './src/index.js'
    },
    output: {
        filename: '[name].bundle.js',
        path: path.resolve(__dirname, 'public')
    },
    module: {
        rules: [{
            test: /\.(js|jsx)$/,
            exclude: /node_modules/,
            use: {
                loader: 'babel-loader',
                options: {
                    presets: ["@babel/preset-react", "@babel/preset-env"],
                },
            }
        }]
    },
    devServer: {
        hot: true,
        allowedHosts: 'all',
    },
    mode: 'production',
    plugins: [
        // new BundleAnalyzerPlugin(),
        new Dotenv(),
        // 환경 변수 정의
        // new webpack.DefinePlugin({
        //     'process.env.NODE_ENV': JSON.stringify('production'),
        // }),
    ],
    resolve: {
        extensions: ['.js', '.jsx'],
        fallback: {
            "process": require.resolve("process/browser")
        }
    },
    cache: {
        type: 'filesystem',
    },
};