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
            }
        ],
    },
    plugins: [
        new webpack.ProvidePlugin({
            "React": "react"
        })
    ],
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, './collabhouse/static/js/'),
    }
};