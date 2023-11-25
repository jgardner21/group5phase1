const simpleGit = require('simple-git');
const os = require('os');
const AdmZip = require('adm-zip');
const fs = require('fs');
const path = require('path');
const express = require('express');
const get_metric_scores = require('./dist/urlparse_cmd/process_url.js').default;
const AWS = require('aws-sdk');
const logger = require('./dist/logger.js').default;
const app = express();



app.use(express.json());

const s3 = new AWS.S3();

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

// Define the API endpoint for uploading NPM packages
app.post('/package', async (req, res) => {
    try {
        logger.debug("Received request to /package endpoint");

        const metadata = req.body.metadata;

        if (!metadata || !metadata.Name || !metadata.Version || !metadata.ID) {
            logger.warn("Incomplete package metadata provided");
            return res.status(400).send({ message: "Incomplete package metadata provided" });
        }

        let fileContent, tempFilePath;

        if (req.body.Content) {
            logger.debug("Handling direct content upload");
            fileContent = Buffer.from(req.body.Content, 'base64');
        } else if (req.body.URL) {
            logger.debug("Handling URL upload");
            const packageURL = req.body.URL;

            // Temporary directory for cloning
            const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'package-'));
            const repoPath = path.join(tempDir, metadata.Name);
            const git = simpleGit();

            try {
                logger.debug(`Cloning repository from ${packageURL}`);
                await git.clone(packageURL, repoPath);

                // Create a zip file from the downloaded repository
                const zip = new AdmZip();
                zip.addLocalFolder(repoPath);
                tempFilePath = path.join(tempDir, `${metadata.Name}.zip`);
                zip.writeZip(tempFilePath);
                logger.debug(`Created zip file at ${tempFilePath}`);

                fileContent = fs.readFileSync(tempFilePath);
            } catch (gitError) {
                logger.error("Error during repository cloning or zipping", gitError);
                return res.status(500).send({ message: "Error processing repository" });
            } finally {
                // Clean up
                fs.rmdirSync(tempDir, { recursive: true });
                logger.debug("Cleaned up temporary files");
            }
        } else {
            logger.warn("No package content or URL provided");
            return res.status(400).send({ message: "No package content or URL provided" });
        }

        const params = {
            Bucket: '461zips',
            Key: `packages/${metadata.Name}-${metadata.Version}.zip`,
            Body: fileContent,
            Metadata: {
                'name': metadata.Name,
                'version': metadata.Version,
                'id': metadata.ID
            }
        };

        // Upload to S3
        logger.debug("Uploading to S3");
        s3.upload(params, function(err, data) {
            if (err) {
                logger.error("Error uploading to S3", err);
                return res.status(500).send({ message: "Error uploading to S3" });
            }

            logger.debug("Package uploaded successfully");
            res.status(201).send({
                message: "Package uploaded successfully",
                s3Location: data.Location
            });
        });

    } catch (error) {
        logger.error("Internal Server Error", error);
        res.status(500).send({ message: "Internal Server Error" });
    }
});
// Other endpoints TBA

const port = 80;
app.listen(port, '0.0.0.0', () => {
    logger.debug(`Server listening on port ${port}`);
});