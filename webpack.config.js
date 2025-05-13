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
        path: path.resolve(__dirname, 'public'),
        // 청크 파일 이름에 해시 추가 (캐싱 문제 방지)
        chunkFilename: '[name].[chunkhash].js'
    },
    module: {
        rules: [{
            test: /\.(js|jsx)$/,
            exclude: /node_modules/,
            use: {
                loader: 'babel-loader',
                options: {
                    presets: ["@babel/preset-react", "@babel/preset-env"],
                    // 최적화를 위한 캐싱 활성화
                    cacheDirectory: true
                },
            }
        }]
    },
    // 소스맵 활성화 (개발 환경에서 디버깅용)
    devtool: process.env.NODE_ENV === 'production' ? 'source-map' : 'eval-source-map',
    devServer: {
        hot: true,
        allowedHosts: 'all',
        // 히스토리 API를 사용하는 SPA를 위한 설정 추가
        historyApiFallback: true,
        // CORS 이슈 방지
        headers: {
            "Access-Control-Allow-Origin": "*",
        }
    },
    // 환경변수에 따라 모드 설정
    mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
    plugins: [
        // 필요할 때 주석 해제하여 번들 분석
        // new BundleAnalyzerPlugin(),
        new Dotenv(),
        // 환경변수 설정
        new webpack.DefinePlugin({
            'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
        })
    ],
    // 최적화 설정 추가
    optimization: {
        // 청크 분할 설정
        splitChunks: {
            chunks: 'all',
            name: false,
        },
        // 런타임 청크 별도 생성
        runtimeChunk: 'single',
    },
    // 해결 설정 (파일 확장자 자동 해결)
    resolve: {
        extensions: ['.js', '.jsx', '.json'],
        // Node.js 폴리필 설정
        fallback: {
            "path": require.resolve("path-browserify"),
            "process": require.resolve("process/browser"),
        }
    }
};