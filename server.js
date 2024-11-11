const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;

const server = http.createServer(async (request, response) => {
	const url = new URL(request.url, `http://${request.headers.host}`);

	if (url.pathname === '/') {
		try {
			const html = await fs.promises.readFile('index.html', 'utf-8');
			response.writeHead(200, { 'Content-Type': 'text/html' });
			response.end(html);
		} catch (error) {
			response.writeHead(500, { 'Content-Type': 'text/plain' });
			response.end('Error loading index.html');
		}
	} else {
		const filePath = path.join(__dirname, url.pathname.slice(1));
		try {
			const js = await fs.promises.readFile(filePath, 'utf-8');
			response.writeHead(200, { 'Content-Type': 'application/javascript' });
			response.end(js);
		} catch (error) {
			// Try to serve the .js file if the original file is not found
			try {
				const jsFilePath = filePath + '.js';
				const js = await fs.promises.readFile(jsFilePath, 'utf-8');
				response.writeHead(200, { 'Content-Type': 'application/javascript' });
				response.end(js);
			} catch (err) {
				response.writeHead(404, { 'Content-Type': 'text/plain' });
				response.end('File not found');
			}
		}
	}
});

// Start the server
server.listen(PORT, () => {
	console.log(`Server listening on port: http://localhost:${PORT}`);
});
