const path = require('path');
const webpack = require('webpack');

module.exports = {
    entry: {
        index: './src/index.js'
    },
    devServer: {
        historyApiFallback: true
    },
    module: {
        rules: [
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader']
            },
            {
                test: /\.js/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-react']
                    }
                }
            },
            {
                test: /\.(gif|png|jpe?g|svg)$/i,
                use: [
                    "file-loader",
                    {
                        loader: "image-webpack-loader"
                    }
                ]
            }
        ],
    },
    plugins: [
        new webpack.ProvidePlugin({
            "React": "react",
            "process": "process/browser"
        })
    ],
    resolve: {
        fallback: {
            buffer: false
        }
    },
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, './collabhouse/static/js/'),
    }
};