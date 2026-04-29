const http = require('http');
const https = require('https');

const baseUrl = process.argv[2] || process.env.DESIGNER_BASE_URL || 'http://localhost:4000';
const routes = [
	'/',
	'/certificate-designer',
	'/badge-designer',
	'/admin-certificate-designer',
	'/admin-badge-designer',
];

function requestRoute(route) {
	const url = new URL(route, baseUrl);
	const client = url.protocol === 'https:' ? https : http;

	return new Promise((resolve, reject) => {
		const request = client.get(
			url,
			{
				headers: {
					Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
				},
			},
			response => {
				let body = '';
				response.setEncoding('utf8');
				response.on('data', chunk => {
					body += chunk;
				});
				response.on('end', () => {
					if (response.statusCode < 200 || response.statusCode >= 400) {
						reject(new Error(`${route} returned HTTP ${response.statusCode}`));
						return;
					}
					if (!body.includes('SOLO Designer') && !body.includes('Designer')) {
						reject(new Error(`${route} did not return the designer HTML shell`));
						return;
					}
					resolve({ route, statusCode: response.statusCode });
				});
			},
		);

		request.setTimeout(15000, () => {
			request.destroy(new Error(`${route} timed out`));
		});
		request.on('error', reject);
	});
}

async function main() {
	const results = [];

	for (const route of routes) {
		results.push(await requestRoute(route));
	}

	results.forEach(result => {
		process.stdout.write(`ok ${result.statusCode} ${result.route}\n`);
	});
}

main().catch(error => {
	process.stderr.write(`${error.message}\n`);
	process.exit(1);
});
