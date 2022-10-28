const path = require('path');
const { spawn } = require('child_process');

const rimraf = require('rimraf');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const externals = require('./build/externals.json');

const NODE_ENV = process.env.NODE_ENV || 'development';
const IS_DEV = NODE_ENV === 'development';
const DIST_PATH = path.resolve(__dirname, 'dist');

rimraf.sync(DIST_PATH);
console.log('Build started...');

class ElectronPlugin {
    ps = null;

    constructor() {
        this.ps = null;

        if (IS_DEV) {
            process.stdin.setEncoding('utf8');
            process.stdin.on('data', (data) => {
                data = (data + '').trim().toLowerCase();

                if (data === 'rs') {
                    this.restart();
                }
            });
        }
    }

    start() {
        if (IS_DEV && !this.ps) {
            this.ps = spawn(
                'electron',
                ['--inspect=9222', '.'],
                { shell: true, env: process.env, stdio: 'inherit' }
            )
            .on('close', code => process.exit(code))
            .on('error', spawnError => console.error(spawnError));
        }
    }

    restart() {
        if (IS_DEV) {
            console.log('Restarting...');

            if (this.ps) {
                this.ps.removeAllListeners();
                this.ps.kill();
                this.ps = null;
            }

            this.start();
        }
    }

    apply(compiler) {
        compiler.hooks.done.tap('ElectronPlugin', () => {
            if (IS_DEV && !this.ps) {
                console.log('Built finished, starting Electron...');
                console.log('Press "rs" to restart Electron.');

                this.start();
            }
        });
    }
}

const commonOptions = {
    mode: NODE_ENV,
    devtool: 'source-map',
    stats: 'errors-only',
    infrastructureLogging: { level: 'error' },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                exclude: /node_modules/,
                use: {
                    loader: 'ts-loader',
                    options: {
                      projectReferences: true
                    },
                },
            },
            {
                test: /\.node$/,
                use: ['node-loader'],
            },
            {
                test: /\.css$/i,
                use: ['style-loader', 'css-loader'],
            },
            {
                test: /\.(png|svg|jpg|jpeg|gif)$/i,
                type: 'asset/resource',
            },
            {
                test: /\.(woff|woff2|eot|ttf|otf)$/i,
                type: 'asset/resource',
            },
            {
                test: /\.(mp4)$/i,
                type: 'asset/resource',
            },
        ],
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
    },
    externals: Object.fromEntries(externals.map(s => [s, `commonjs ${s}`])),
    plugins: [],
};

// The renderer process has to come first in this config.
module.exports = [
    {
        ...commonOptions,
        entry: {
            index: './packages/renderer/src/index.tsx',
        },
        output: {
            path: path.join(DIST_PATH, 'renderer'),
        },
        target: 'web',
        plugins: [
            ...commonOptions.plugins,
            new HtmlWebpackPlugin({
                template: './packages/renderer/src/index.html',
                inject: 'body',
            }),
        ],
        devServer: {
            compress: false,
            port: 8083,
            hot: true,
            static: {
                directory: path.join(DIST_PATH, 'renderer'),
            },
            devMiddleware: {
                writeToDisk: true,
            },
        }
    },
    {
        ...commonOptions,
        entry: {
            index: './packages/main/src/index.ts',
            preload: './packages/main/src/preload.ts',
        },
        output: {
            path: path.join(DIST_PATH, 'main'),
        },
        target: 'electron-main',
        plugins: [
            ...commonOptions.plugins,
            new ElectronPlugin(),
        ]
    }
];
