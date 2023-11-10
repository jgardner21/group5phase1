const express = require('express');
const get_metric_scores = require('./dist/urlparse_cmd/process_url.js').default;
const logger = require('./dist/logger.js').default;
const app = express();

app.use(express.json());

// Define the API endpoint for rating NPM packages
app.post('/rate', async (req, res) => {
    try {
        const { filename } = req.body;
        const scores = await get_metric_scores(filename);
        res.json(scores);
    } catch (err) {
        logger.error("API call for rating failed", err);
        res.status(500).send("An error occurred while rating the package.");
    }
});

// Other endpoints TBA

const port = 80;
app.listen(port, () => {
    logger.debug(`Server listening at http://localhost:${port}`);
});