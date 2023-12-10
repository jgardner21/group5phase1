const simpleGit = require('simple-git');
const os = require('os');
const AdmZip = require('adm-zip');
const fs = require('fs');
const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const get_metric_scores = require('./dist/urlparse_cmd/process_url.js').default;
const AWS = require('aws-sdk');
const logger = require('./dist/logger.js').default;
const cors = require('cors');
const app = express();
const shortid = require('shortid');


// CORS configuration for development and production
const corsOptions = {
    /* origin: function (origin, callback) {
         const allowedOrigins =
             ['http://localhost:3000', 'http://ec2-18-222-159-163.us-east-2.compute.amazonaws.com'];
         if (!origin || allowedOrigins.indexOf(origin) !== -1) {
             callback(null, true); // Allow
         } else {
             callback(new Error('Not allowed by CORS')); // Block
         }
     },*/
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: '*',
};

app.use(cors(corsOptions));
app.use(bodyParser.json({limit: '100mb'}));
app.use(bodyParser.urlencoded({limit: '100mb', extended: true}));
app.use(express.json());

AWS.config.update({
    region: 'us-east-2'
});
const s3 = new AWS.S3();
const dynamoDB = new AWS.DynamoDB.DocumentClient();


/**
 * Define the API endpoint for uploading packages
 *
 * TODO: Implement rating check
 * TODO: Error handling for missing json
 */
app.post('/package', async (req, res) => {
    logger.debug("POST /package endpoint called");
    logger.debug("Request body: ", req.body);

    try {
        let fileContent, tempDir, repoPath, zip, packageJson, packageName, packageVersion;

        // Check if both Content and URL are provided
        if (req.body.Content && req.body.URL) {
            logger.warn("Invalid request: Both Content and URL provided", {
                Content: req.body.Content,
                URL: req.body.URL
            });
            return res.status(400).send({message: "Both Content and URL cannot be set"});
        }

        if (req.body.Content) {
            logger.debug("Processing direct content upload");
            fileContent = Buffer.from(req.body.Content, 'base64');
            tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'package-'));
            logger.debug(`Temporary directory created for zip content: ${tempDir}`);

            const zipFilePath = path.join(tempDir, 'package.zip');
            fs.writeFileSync(zipFilePath, fileContent);
            logger.debug(`Written base64 content to temporary zip file at: ${zipFilePath}`);

            zip = new AdmZip(zipFilePath);
            // Adding extraction for meta data from pacakge zip
            const packageJsonEntry = zip.getEntries().find(entry => entry.entryName === 'package.json');

            if (!packageJsonEntry) {
                return res.status(500).send({ message: "Error reading package.json"});
            }

            packageJson = JSON.parse(packageJsonEntry.getData().toString('utf8'));
            packageName = packageJson.name;
            packageVersion = packageJson.version;
            logger.debug(`Extracted package info: Name - ${packageName}, Version - ${packageVersion}`);

            // end of fix for package json
            
            repoPath = path.join(tempDir, 'repo');
            zip.extractAllTo(repoPath, true);
            logger.debug(`Extracted zip content to temporary repository path: ${repoPath}`);
        } else if (req.body.URL) {
            logger.debug("Processing URL upload: ", req.body.URL);

            tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'package-'));
            repoPath = path.join(tempDir, 'repo');
            logger.debug(`Temporary directory created for repository clone: ${tempDir}`);

            const git = simpleGit();
            await git.clone(req.body.URL, repoPath).catch(err => {
                logger.error("Error cloning repository", {URL: req.body.URL, Error: err.message});
                throw err;
            });
            logger.debug(`Cloned repository to temporary path: ${repoPath}`);
        } else {
            logger.warn("Invalid request: No package content or URL provided");
            return res.status(400).send({message: "No package content or URL provided"});
        }

        // // Extract package name and version from package.json
        // try {
        //     packageJson = JSON.parse(fs.readFileSync(path.join(repoPath, 'package.json'), 'utf8'));
        // } catch (readError) {
        //     logger.error("Error reading package.json", {
        //         Path: path.join(repoPath, 'package.json'),
        //         Error: readError.message
        //     });
        //     return res.status(500).send({message: "Error reading package.json"});
        // }

        // packageName = packageJson.name;
        // packageVersion = packageJson.version;
        // logger.debug(`Extracted package info: Name - ${packageName}, Version - ${packageVersion}`);

        // Check if the package already exists
        const packageExists = await checkIfPackageExists(packageName, packageVersion);
        if (packageExists) {
            logger.warn(`Package already exists: ${packageName}, Version: ${packageVersion}`);
            return res.status(409).send({message: "Package already exists"});
        }

        const packageId = shortid.generate();
        logger.debug(`Generated unique package ID: ${packageId}`);

        // Create a zip file from the extracted content
        zip = new AdmZip();
        zip.addLocalFolder(repoPath);
        const finalZipPath = path.join(tempDir, `${packageName}-${packageVersion}.zip`);
        zip.writeZip(finalZipPath);
        logger.debug(`Created final zip package for upload at: ${finalZipPath}`);

        fileContent = fs.readFileSync(finalZipPath);
        const s3Params = {
            Bucket: '461zips',
            Key: `packages/${packageName}-${packageVersion}.zip`,
            Body: fileContent,
            Metadata: {'name': packageName, 'version': packageVersion, 'id': packageId}
        };

        logger.debug("Starting S3 upload", {Bucket: s3Params.Bucket, Key: s3Params.Key});
        s3.upload(s3Params, async function (err, data) {
            if (err) {
                logger.error("Error uploading to S3", {Error: err.message});
                return res.status(500).send({message: "Error uploading to S3"});
            }

            logger.debug("S3 upload successful");

            // Prepare DynamoDB entry
            const dynamoDBParams = {
                TableName: 'S3Metadata',
                Item: {id: packageId, s3Key: s3Params.Key, name: packageName, version: packageVersion}
            };

            try {
                await dynamoDB.put(dynamoDBParams).promise();
                logger.debug("DynamoDB metadata write successful");

                // Construct the response payload
                const responsePayload = {
                    metadata: {Name: packageName, Version: packageVersion, ID: packageId},
                    data: {}
                };

                // Conditionally add Content or URL to the response
                if (req.body.Content) {
                    responsePayload.data.Content = req.body.Content;
                } else if (req.body.URL) {
                    responsePayload.data.URL = req.body.URL;
                }

                res.status(201).send(responsePayload);
                logger.debug("Response sent to client: " + JSON.stringify(responsePayload));
            } catch (dbError) {
                logger.error("Error writing to DynamoDB", {Error: dbError.message});
                res.status(500).send({message: "Error writing metadata to DynamoDB"});
            }
        });

        // Clean up temporary files
        fs.rmdirSync(tempDir, {recursive: true});
        logger.debug("Cleaned up temporary files", {TempDir: tempDir});
    } catch (error) {
        logger.error("Internal Server Error", {Error: error.message});
        res.status(500).send({message: "Internal Server Error"});
    }
});


async function checkIfPackageExists(packageId) {
    const params = {
        TableName: 'S3Metadata',
        Key: {
            id: packageId
        }
    };

    try {
        const result = await dynamoDB.get(params).promise();
        return result.Item;
    } catch (error) {
        logger.error("Error checking if package exists", error);
        throw error;
    }
}

// Define the API endpoint for retrieving packages
app.get('/package/:id', async (req, res) => {
    try {
        const packageId = req.params.id;

        // Get the S3 key from DynamoDB
        const s3Key = await getS3KeyFromDynamoDB(packageId);
        if (!s3Key) {
            return res.status(404).send({message: 'Package does not exist.'});
        }

        // Retrieve object from S3
        const s3Params = {
            Bucket: '461zips',
            Key: s3Key
        };

        logger.debug(`Fetching package data from S3 for package ${packageId}`);
        const data = await s3.getObject(s3Params).promise();
        const packageContent = data.Body.toString('base64');

        // Extract metadata from S3 object
        const metadata = {
            Name: data.Metadata['name'],
            Version: data.Metadata['version'],
            ID: data.Metadata['id']
        };

        // Extract GitHub URL from package.json inside the zip
        logger.debug(`Extracting GitHub URL from package.json inside the zip for package ${packageId}`);
        const gitHubURL = await fetchPackageGitHubURL(data.Body);

        // Prepare and send the package response
        const response = {
            metadata: metadata,
            data: {
                Content: packageContent,
                URL: gitHubURL,
                JSProgram: "if (process.argv.length === 7) { console.log('Success'); process.exit(0); } else " +
                    "{ console.log('Failed'); process.exit(1); }"
            }
        };

        logger.debug(`Package retrieved successfully for package ${packageId}`);
        res.status(200).json(response);
    } catch (error) {
        logger.error(`Error in GET /package/${req.params.id}`, error);
        if (error.code === 'NoSuchKey') {
            res.status(404).send({message: 'Package does not exist.'});
        } else {
            res.status(500).send({message: 'Internal Server Error'});
        }
    }
});

// Define the API endpoint for updating packages
app.put('/package/:id', async (req, res) => {
    try {
        logger.info(`Received request to /package/:${req.params.id}`);
        const packageId = req.params.id;
        const {metadata, data} = req.body;

        // Validate request body
        if (!metadata || !data || !metadata.Name || !metadata.Version || !metadata.ID) {
            logger.warn("Invalid request data");
            return res.status(400).send({message: "Invalid request data"});
        }

        // Check if package ID matches with metadata ID
        if (packageId !== metadata.ID) {
            logger.warn("Package ID mismatch");
            return res.status(400).send({message: "Package ID mismatch"});
        }

        logger.debug("Request body validated. Checking if package exists...")
        // Check if the package exists in DynamoDB
        const dynamoDBGetParams = {
            TableName: 'S3Metadata',
            Key: {id: packageId}
        };

        const result = await dynamoDB.get(dynamoDBGetParams).promise();
        if (!result.Item) {
            return res.status(404).send({message: 'Package does not exist.'});
        }

        // Adding a check for name and version
        if (result.Item.name !== metadata.Name || result.Item.version !== metadata.Version) {
            logger.warn("Package name or version mismatch");
            return res.status(400).send({message: "Package name or version mismatch"});
        }

        logger.debug("Package exists. Updating...");
        // Update package in S3
        const s3Key = `packages/${metadata.Name}-${metadata.Version}.zip`;
        const updateParams = {
            Bucket: '461zips',
            Key: s3Key,
            Body: Buffer.from(data.Content, 'base64'),
            Metadata: {
                'name': metadata.Name,
                'version': metadata.Version,
                'id': metadata.ID
            }
        };

        await s3.upload(updateParams).promise();
        logger.debug("Package updated in S3");

        // Update DynamoDB entry
        const dynamoDBUpdateParams = {
            TableName: 'S3Metadata',
            Key: {id: packageId},
            UpdateExpression: "set s3Key = :s",
            ExpressionAttributeValues: {
                ":s": s3Key
            }
        };

        await dynamoDB.update(dynamoDBUpdateParams).promise();
        logger.debug("DynamoDB entry updated");

        res.status(200).send({message: "Package updated successfully"});
    } catch (error) {
        logger.error("Error in PUT /package/:id", error);
        res.status(500).send({message: "Internal Server Error"});
    }
});

// Define the API endpoint for rating NPM packages
app.get('/package/:id/rate', async (req, res) => {
    try {
        const packageId = req.params.id;

        // Get the S3 key from DynamoDB
        const s3Key = await getS3KeyFromDynamoDB(packageId);
        if (!s3Key) {
            return res.status(404).send({message: 'Package does not exist.'});
        }

        // Retrieve object from S3
        const s3Params = {
            Bucket: '461zips',
            Key: s3Key
        };

        logger.debug(`Fetching package data from S3 for package ${packageId}`);
        const data = await s3.getObject(s3Params).promise();

        // Extract GitHub URL from package.json inside the zip
        logger.debug(`Extracting GitHub URL from package.json inside the zip for package ${packageId}`);
        const gitHubURL = await fetchPackageGitHubURL(data.Body);

        // Create a temporary file with the GitHub URL and pass it to get_metric_scores
        const tempFilePath = path.join(os.tmpdir(), `${packageId}-urls.txt`);
        fs.writeFileSync(tempFilePath, gitHubURL + '\n');

        // Get metric scores
        const scores = await get_metric_scores(tempFilePath);

        //adding a error for score handling
        if (!scores) {
            return res.status(500).send({ message: 'Error computing package metrics.' });
        }
        //end of error 

        //fix response
        res.status(200).json(scores);

        // Cleanup temporary file
        fs.unlinkSync(tempFilePath);
    } catch (error) {
        logger.error(`Error in GET /package/${req.params.id}/rate`, error);
        res.status(500).send({message: 'Internal Server Error'});
    }
});

// Define the API endpoint for listing/searching packages in the directory
app.post('/packages', async (req, res) => {
    try {
        logger.info("Received request to /packages endpoint");
        const packageQueries = req.body;
        const offset = req.query.offset ? JSON.parse(req.query.offset) : null;
        const limit = 55; // Adjust as per requirement

        logger.debug("Validating request body");
        if (!Array.isArray(packageQueries) || packageQueries.length === 0) {
            return res.status(400).send({message: "Invalid request body"});
        }

        // Validate offset (ensure it's a number or a valid format)
        if (offset !== null && (typeof offset !== 'number' || offset < 0)) {
            return res.status(400).send({ message: "Invalid offset parameter" });
        }

        const results = [];
        let lastEvaluatedKey = offset;

        for (const query of packageQueries) {
            if (!query.Name || query.Name.length === 0) {
                return res.status(400).send({message: "Invalid request body"});
            }

            let scanParams = {
                TableName: "S3Metadata",
                Limit: limit,
                ExclusiveStartKey: lastEvaluatedKey
            };

            if (query.Name !== '*') {
                scanParams.FilterExpression = "#pkgName = :nameVal";
                scanParams.ExpressionAttributeValues = {":nameVal": query.Name};
                scanParams.ExpressionAttributeNames = {"#pkgName": "name"};

                if (query.Version) {
                    scanParams.FilterExpression += " and version = :versionVal";
                    scanParams.ExpressionAttributeValues[":versionVal"] = query.Version;
                }
            }

            logger.debug(`Scanning DynamoDB with parameters: ${JSON.stringify(scanParams)}`);
            const queryResult = await dynamoDB.scan(scanParams).promise();
            results.push(...queryResult.Items.map(item => ({
                Name: item.name,
                Version: item.version,
                ID: item.id
            })));
            lastEvaluatedKey = queryResult.LastEvaluatedKey;
            if (results.length >= limit) {
                return res.status(413).send({ message: "Too many packages returned" });
            }
        }

        res.header('offset', lastEvaluatedKey ? JSON.stringify(lastEvaluatedKey) : null);
        res.status(200).json(results);
    } catch (error) {
        logger.error('Error in POST /packages:', error);
        res.status(500).send({message: 'Internal Server Error'});
    }
});


// Define the API endpoint to reset the directory to default state
app.delete('/reset', async (req, res) => {
    try {
        logger.info("Received request to /reset endpoint. Emptying S3 bucket...");
        const listParams = {Bucket: '461zips'};
        const listedObjects = await s3.listObjectsV2(listParams).promise();

        logger.debug("Number of objects in the bucket: " + listedObjects.Contents.length);
        if (listedObjects.Contents.length === 0) return;

        const deleteParams = {
            Bucket: '461zips',
            Delete: {Objects: []}
        };

        listedObjects.Contents.forEach(({Key}) => {
            deleteParams.Delete.Objects.push({Key});
        });

        await s3.deleteObjects(deleteParams).promise();

        if (listedObjects.IsTruncated) await emptyS3Bucket();

        logger.debug("S3 bucket emptied successfully. Deleting DynamoDB entries...");
        const scanResult = await dynamoDB.scan({TableName: 'S3Metadata'}).promise();

        for (const item of scanResult.Items) {
            await dynamoDB.delete({
                TableName: 'S3Metadata',
                Key: {id: item.id}
            }).promise();
        }

        logger.debug("DynamoDB entries deleted successfully. Reset complete.");
        res.status(200).send({message: "Registry is reset."});
    } catch (error) {
        logger.error("Error resetting registry", error);
        res.status(500).send({message: "Internal Server Error"});
    }
});


// Define the API endpoint for searching by RegEx
// this is extremely inefficient. finding a better way might involve adjusting other endpoints
app.post('/package/byRegEx', async (req, res) => {
    try {
        const {RegEx} = req.body;

        // Validate the regex input
        if (!RegEx) {
            return res.status(400).send({message: "Regex pattern is required"});
        }

        let regex;
        try {
            regex = new RegExp(RegEx);
        } catch (error) {
            return res.status(400).send({message: "Invalid regex pattern"});
        }

        logger.debug(`Searching packages with regex: ${RegEx}`);

        // List all packages from DynamoDB
        const scanParams = {
            TableName: "S3Metadata",
            ProjectionExpression: "id"
        };
        const allPackages = await dynamoDB.scan(scanParams).promise();

        const matchedPackages = [];

        for (const pkg of allPackages.Items) {
            const packageData = await fetchPackageData(pkg.id);
            const readme = extractReadmeFromZip(packageData.data.Content);

            // Check regex against both README and package name
            if (regex.test(readme) || regex.test(packageData.metadata.name)) {
                matchedPackages.push({
                    Version: packageData.metadata.version,
                    Name: packageData.metadata.name
                });
            }
        }

        if (matchedPackages.length === 0) {
            return res.status(404).send({message: "No package found under this regex"});
        }

        res.status(200).json(matchedPackages);
    } catch (error) {
        logger.error('Error in POST /package/byRegEx:', error);
        res.status(500).send({message: 'Internal Server Error'});
    }
});

async function fetchPackageData(packageId) {
    try {
        const s3Key = await getS3KeyFromDynamoDB(packageId);
        if (!s3Key) {
            throw new Error('Package does not exist.');
        }

        const s3Params = {
            Bucket: '461zips',
            Key: s3Key
        };

        const data = await s3.getObject(s3Params).promise();
        const packageContent = data.Body.toString('base64');

        const metadata = {
            Name: data.Metadata['name'],
            Version: data.Metadata['version'],
            ID: data.Metadata['id']
        };

        return {
            metadata: metadata,
            data: {
                Content: packageContent,
            }
        };
    } catch (error) {
        logger.error(`Error fetching package data for package ID ${packageId}`, error);
        throw error;
    }
}

function extractReadmeFromZip(encodedZipContent) {
    const zipContent = Buffer.from(encodedZipContent, 'base64');
    const zip = new AdmZip(zipContent);
    const zipEntries = zip.getEntries();

    const readmeEntry = zipEntries.find(entry => /readme\.md/i.test(entry.entryName));

    if (readmeEntry) {
        return readmeEntry.getData().toString('utf8');
    } else {
        return ''; // No README found, return an empty string
    }
}

async function emptyS3Bucket() {
    const listedObjects = await s3.listObjectsV2({Bucket: '461zips'}).promise();

    if (listedObjects.Contents.length === 0) return;

    const deleteParams = {
        Bucket: '461zips',
        Delete: {Objects: []}
    };

    listedObjects.Contents.forEach(({Key}) => {
        deleteParams.Delete.Objects.push({Key});
    });

    await s3.deleteObjects(deleteParams).promise();

    if (listedObjects.IsTruncated) await emptyS3Bucket();
}

const fetchPackageGitHubURL = async (zipBuffer) => {
    logger.debug("Starting fetchPackageGitHubURL function");
    const zip = new AdmZip(zipBuffer);
    const packageJsonEntry = zip.getEntry("package.json");

    if (!packageJsonEntry) {
        logger.warn("package.json not found in the zip file");
        throw new Error("package.json not found in the zip file");
    }

    const packageJsonContent = JSON.parse(packageJsonEntry.getData().toString('utf-8'));

    let gitHubURL;
    const repository = packageJsonContent.repository;

    if (typeof repository === 'string') {
        // Handle string format
        gitHubURL = `https://github.com/${repository}`;
    } else if (repository && repository.url) {
        // Handle object format with URL
        gitHubURL = repository.url;

        // Trimming 'git+' prefix if present
        if (gitHubURL.startsWith('git+')) {
            logger.debug("Trimming 'git+' prefix from GitHub URL");
            gitHubURL = gitHubURL.substring(4);
        }

        // Trimming '.git' suffix if present
        if (gitHubURL.endsWith('.git')) {
            logger.debug("Trimming '.git' suffix from GitHub URL");
            gitHubURL = gitHubURL.slice(0, -4);
        }
    } else {
        gitHubURL = "URL not found";
    }

    logger.debug(`Finished fetchPackageGitHubURL function, GitHub URL is ${gitHubURL}`);
    return gitHubURL;
};

async function getS3KeyFromDynamoDB(id) {
    const params = {
        TableName: 'S3Metadata',
        Key: {
            id: id
        }
    };

    const result = await dynamoDB.get(params).promise();
    return result.Item ? result.Item.s3Key : null;
}

const port = 80;
app.listen(port, '0.0.0.0', () => {
    logger.debug(`Server listening on port ${port}`);
});

