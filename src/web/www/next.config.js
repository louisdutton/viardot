/** @type {import('next').NextConfig} */
const nextConfig = {
	reactStrictMode: true,
	webpack: function (config, options) {
		console.log(options.webpack.version); // 4.44.1
		config.experiments = {
			syncWebAssembly: true,
		};
		return config;
	},
};

module.exports = nextConfig;
