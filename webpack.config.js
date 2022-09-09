const path = require('path');
const { merge } = require('webpack-merge');
const postcssPresetEnv = require('postcss-preset-env');
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");
const TerserPlugin = require("terser-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyPlugin = require("copy-webpack-plugin");
const pages = ["index", "article", "login", "admin", "register"];

const prod = {
    mode: 'production',

    output: {
        filename: 'js/[name].[contenthash].js',
    },

    optimization: {
        runtimeChunk: 'single',
        minimizer: [
            new TerserPlugin({
                extractComments: false,
                terserOptions: {
                    format: {
                        comments: false,
                    },
                },
            }),
            new CssMinimizerPlugin(),
        ],
    },

    plugins: [
        new MiniCssExtractPlugin({
            filename: (pathData) => {
                return pathData.chunk.name == 'vendors' ? "css/vendors[contenthash].css" : 'css/index[contenthash].css';
            }
        }),
    ],

    module: {
        rules: [
            {
                test: /\.js$/,
                include: path.resolve(__dirname, 'src/js'),
                use: {
                    loader: 'babel-loader', options: {
                        presets: ['@babel/preset-env']
                    },
                },
            },
            {
                test: /\.s[ac]ss$/i,
                use: [{ loader: MiniCssExtractPlugin.loader },
                {
                    loader: "css-loader",
                    options: {
                        importLoaders: 1,
                        sourceMap: true,
                        url: true
                    }
                },
                {
                    loader: 'postcss-loader',
                    options: {
                        postcssOptions: {
                            plugins: [postcssPresetEnv({ browsers: '>= 0.5%, last 6 versions, Firefox ESR, not dead' })],
                        },
                    },
                },
                {
                    loader: "sass-loader",
                    options: {
                        sourceMap: true,
                    },
                },
                ],
            },

        ]
    },
};

const dev = {

    mode: 'development',

    output: {
        filename: '[name].js',
    },

    module: {
        rules: [
            {
                test: /\.s[ac]ss$/i,
                use: [
                    "style-loader",
                    {
                        loader: "css-loader",
                        options: {
                            sourceMap: true,
                        },
                    },
                    {
                        loader: "sass-loader",
                        options: {
                            sourceMap: true,
                        },
                    },
                ],
            },
        ],
    },
};

const common = (options) => {

    const HtmlWebpackPlugins = pages.map((page) => new HtmlWebpackPlugin({
        inject: true,
        template: `src/pages/${page}.html`,
        filename: `${options.htmlPath}/${page}.html`,
        chunks: [page],
    }));

    return {
        devtool: "source-map",

        entry: pages.reduce((config, page) => {
            config[page] = `./src/js/${page}.js`;
            return config;
        }, {}),

        output: {
            path: `${options.jsPath}`,
            publicPath: '/',
            assetModuleFilename: (pathData) => {
                let cleaned = pathData.module.rawRequest.replaceAll('../', '');
                return `${cleaned}`
            },
        },

        optimization: {
            splitChunks: {
                cacheGroups: {
                    common: {
                        test: /[\\/]src[\\/]js[\\/]/,
                        chunks: "all",
                        minSize: 0,
                        minChunks: 2,
                        name: (module) => {
                            return "common~" + module.userRequest.replace(module.context, "").replace("\\", "").replace(".js", "");
                        },
                    }

                },
            },
        },

        plugins: [
            ...HtmlWebpackPlugins,
            new CopyPlugin({
                patterns: [
                    { from: "src/img", to: "img" },
                ]
            }),
        ],

        module: {
            rules: [
                {
                    test: /\.(png|svg|jpg|jpeg|gif|webp)$/i,
                    type: 'asset/resource',
                },
                {
                    test: /\.(woff|woff2|eot|ttf|otf)$/i,
                    type: 'asset/resource',
                },
                {
                    test: /\.html$/,
                    include: path.resolve(__dirname, 'src/templates'),
                    type: 'asset/source',
                },
            ],
        },
    };
};

module.exports = function (env) {
    const htmlPath = env.server ? '/' : path.resolve(__dirname, 'dist/');
    const jsPath = env.server ? '/' : path.resolve(__dirname, 'dist/');
    const options = {"htmlPath": htmlPath, "jsPath": jsPath};

    if (env.production) return merge(common(options), prod);
    return merge(common(options), dev);
};