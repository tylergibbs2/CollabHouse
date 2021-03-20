const path = require('path');

module.exports = {
    entry: {
        index: './src/index.js'
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
    resolve: {
        extensions: ['.js'],
        alias: {
            'react': 'preact/compat',
            'react-dom': 'preact/compat'
        }
    },
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, './collabhouse/static/js/'),
    }
};