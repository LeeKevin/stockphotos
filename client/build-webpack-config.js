const path = require('path')
const url = require('url')
const webpack = require('webpack')
const ExtractTextPlugin = require('extract-text-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const autoprefixer = require('autoprefixer')


module.exports = function (options) {
    const isDevServer = process.argv.find(v => v.includes('webpack-‌​dev-server'))

    const entry = {
        bundle: ['./src/index.js'],
        vendor: ['react', 'react-router', 'moment-timezone', 'numeral'],
    }

    const output = {
        path: path.join(__dirname, 'public'),
        publicPath: '/',
        filename: 'js/[name].js',
    }

    const loaders = [
        {
            test: /\.(woff|woff2|eot|ttf|svg)(\?.*)?$/,
            loader: 'url-loader?limit=10000&name=fonts/[name].[ext]',
            include: [
                /node_modules\/font-awesome/,
            ],
        },
        {
            test: /\.(png|jpe?g|gif|bmp|webp)$/,
            exclude: [/node_modules/],
            loader: 'url-loader?limit=10000&name=images/[name].[ext]',
        },

        // Add json loader
        {
            test: /\.json$/,
            loaders: ['json'],
        },
    ]

    if (isDevServer) {
        entry.bundle.unshift(
            'webpack-dev-server/client?http://localhost:3001',
            'webpack/hot/only-dev-server'
        )
    }

    const postcss = function () {
        return [autoprefixer]
    }

    const plugins = [
        new webpack.optimize.CommonsChunkPlugin('vendor'),
        new HtmlWebpackPlugin({
            template: './src/index.html',
        }),
    ]

    const babelLoader = {
        test: /\.js$/,
        exclude: [/node_modules/],
        loader: 'babel',
        query: {
            cacheDirectory: true,
            presets: ['es2015', 'react', 'stage-2', 'react-hmre'],
            plugins: [
                'add-module-exports',
                'transform-decorators-legacy',
            ],
        },
    }

    const environment = {
        SERVER_URL: JSON.stringify(options.server),
        API_URL: JSON.stringify(url.resolve(options.server, options.apiURI)),
        CLIENT_ID: JSON.stringify(options.clientId),
        STRIPE_KEY: JSON.stringify(options.stripeKey),
    }


    if (options.minimize) {
        plugins.push(
            new webpack.optimize.UglifyJsPlugin({
                compressor: {
                    warnings: false,
                },
            }),
            new webpack.optimize.DedupePlugin(),
            new webpack.NoErrorsPlugin()
        )

        environment.NODE_ENV = JSON.stringify('production')
        babelLoader.query.plugins.push('transform-react-inline-elements')
        babelLoader.query.plugins.push('transform-react-constant-elements')

        const cssLoader = `css?modules${options.sourcemap ?
            '&sourceMap' :
            ''}&importLoaders=1&localIdentName=[name]__[local]___[hash:base64:5]`
        loaders.push({
            test: /[\/\\]src[\/\\].*\.css/,
            exclude: /(node_modules|public\/)/,
            loader: ExtractTextPlugin.extract('style', cssLoader),
        })

        // local scss modules
        loaders.push({
            test: /[\/\\]src[\/\\].*\.scss/,
            exclude: /(node_modules|public\/)/,
            loader: ExtractTextPlugin.extract('style',
                `${cssLoader}!postcss!sass${options.sourcemap ? '&sourceMap' : ''}`),
        })

        plugins.push(new ExtractTextPlugin('[contenthash].css', {
            allChunks: true,
        }))
    } else {
        if (options.sourcemap) {
            plugins.push(new webpack.SourceMapDevToolPlugin({
                // asset matching
                filename: '[file].map',
                exclude: ['vendor.js', /node_modules/],

                // quality/performance
                module: true,
                columns: true,
            }))
        }

        // css
        loaders.push({
            test: /\.css$/,
            exclude: /[\/\\]src[\/\\]/,
            loaders: [
                `style?${options.sourcemap ? 'sourceMap' : ''}`,
                'css',
            ],
        })

        // scss modules
        loaders.push({
            test: /\.scss$/,
            exclude: /[\/\\](node_modules\/)[\/\\]/,
            loaders: [
                `style`,
                `css?importLoaders=1${options.sourcemap ? '&sourceMap' : ''}`,
                'postcss',
                `sass?${options.sourcemap ? 'sourceMap' : ''}`,
            ],
        })
    }

    loaders.push(babelLoader)
    plugins.push(new webpack.DefinePlugin({
        'process.env': environment,
    }))


    return {
        cache: true,
        entry,
        output,
        debug: options.debug,
        module: {
            loaders,
        },
        postcss,
        plugins,
    }
}
