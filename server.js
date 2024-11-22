const express = require('express');
const zlib = require('zlib');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3000;

// Middleware to parse JSON requests
app.use(express.json());

app.listen(port, () => {
	console.log(`Mock server running at http://localhost:${port}`);
});

// Route to handle POST request
app.post('/test-response', async (req, res) => {
	const filePath = path.join(__dirname, 'json_files/test_response.json');
	await readJsonAndSendResponse(req, res, filePath);
});

const readJsonAndSendResponse = async (req, res, filePath) => {
	try {
		const jsonData = await readJsonFromFile(filePath); // Use the reusable function
		prepareAndSendResponse(req, res, jsonData);
	} catch (error) {
		console.error('Error reading or parsing JSON file:', error);
		res.status(500).send('Internal Server Error');
	}
};

const readJsonFromFile = (filePath) => {
	return new Promise((resolve, reject) => {
		fs.readFile(filePath, 'utf8', (err, data) => {
			if (err) {
				reject(err);
			} else {
				try {
					resolve(JSON.parse(data)); // Parse JSON string into an object
				} catch (parseError) {
					reject(parseError);
				}
			}
		});
	});
};

const prepareAndSendResponse = (req, res, data) => {
	// Check if the "Accept-Encoding" header is missing or does not include compression
	const acceptEncoding = req.headers['accept-encoding'] || '';

	if (acceptEncoding.includes('deflate')) {
		// Respond with deflate-compressed data
		console.log('Compressing response as deflate');
		res.setHeader('Content-Encoding', 'deflate');
		res.setHeader('Content-Type', 'application/json');
		zlib.deflate(JSON.stringify(data), (err, result) => {
			if (err) {
				res.status(500).send('Error compressing response');
			} else {
				res.send(result);
			}
		});
	} else if (!acceptEncoding || acceptEncoding.trim() === '' || acceptEncoding.includes('identity')) {
		// Respond with plain JSON for identity
		console.log('Responding with plain JSON (identity)');
		res.setHeader('Content-Type', 'application/json');
		res.json(data);
	} else {
		// Default to gzip if no `Accept-Encoding` header or if it includes `gzip`
		console.log('Compressing response as gzip');
		res.setHeader('Content-Encoding', 'gzip');
		res.setHeader('Content-Type', 'application/json');
		zlib.gzip(JSON.stringify(data), (err, result) => {
			if (err) {
				res.status(500).send('Error compressing response');
			} else {
				res.send(result);
			}
		});
	}
};