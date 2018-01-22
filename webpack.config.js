const path = require('path'),
    ExtractTextPlugin = require('extract-text-webpack-plugin');

module.exports = {
	entry: './src/scss/styles.scss',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'styles.css'
    },
    module: {
        rules: [
            // SCSS:
            {
                test: /\.scss$/,
                use: ExtractTextPlugin.extract({
                    fallback: 'style-loader',
                    use: [
                        {
                            loader: 'css-loader',
                            options: {
                                minimize: true
                            }
                        },
                        {
                            loader: 'sass-loader'
                        }
                    ]
                })
            }
        ]
    },
    plugins: [
        new ExtractTextPlugin('styles.css', {
            allChunks: true
        })
    ]/*,
    devServer: {
        contentBase: [
            path.resolve(__dirname, "dist"),
            path.resolve(__dirname, "node_modules")
        ],
        publicPath:  "/"
    }*/
};