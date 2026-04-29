const webpack = require('webpack');
const path = require('path');
const merge = require('webpack-merge');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const CompressionPlugin = require('compression-webpack-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

const baseConfig = require('./webpack.common.js');

const plugins = [
	new webpack.LoaderOptionsPlugin({
		minimize: true,
	}),

	new CompressionPlugin({
		algorithm: 'gzip',
		test: new RegExp('.(' + ['js', 'css', 'mjs'].join('|') + ')$'),
		threshold: 1024,
		minRatio: 0.8,
	}),
	new HtmlWebpackPlugin({
		filename: 'index.html',
		title: 'SOLO Designer',
		meta: {
			viewport: 'width=device-width, initial-scale=1.0',
			description: `React Design Editor has started to developed direct manipulation of editable design tools like Powerpoint, We've developed it with react.js, ant.design, fabric.js`,
		},
	}),

];

if (process.env.ANALYZE_BUNDLE === 'true') {
	plugins.push(new BundleAnalyzerPlugin());
}

module.exports = merge(baseConfig, {
	mode: 'production',
	entry: {
		app: [path.resolve(__dirname, 'src/index.tsx')],
	},
	output: {
		path: path.resolve(__dirname, 'docs'),
		filename: 'js/[name].[chunkhash:16].js',
		chunkFilename: 'js/[id].[chunkhash:16].js',
		publicPath: './',
	},
	optimization: {
		splitChunks: {
			cacheGroups: {
				vendor: {
					name: 'node_vendors', // part of the bundle name and
					// can be used in chunks array of HtmlWebpackPlugin
					test: /[\\/]node_modules[\\/]/,
					chunks: 'initial',
				},
				common: {
					test: /[\\/]src[\\/]components[\\/]/,
					chunks: 'all',
					minSize: 0,
				},
			},
		},
		minimizer: [
			new TerserPlugin({
				cache: true,
				parallel: true,
				sourceMap: false,
				terserOptions: {
					warnings: false,
					compress: {
						warnings: false,
						unused: true, // tree shaking(export된 모듈 중 사용하지 않는 모듈은 포함하지않음)
					},
					ecma: 6,
					mangle: true,
					unused: true,
				},
			}),
		],
	},
	plugins,
});
