// require('dotenv').config();
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
const glob = require('glob');



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
            const packageJsonEntry = zip.getEntries().find(entry => entry.entryName.endsWith('package.json'));
            
            if (!packageJsonEntry) {
                return res.status(500).send({ message: "Error reading package.json"});
            }

            packageJson = JSON.parse(packageJsonEntry.getData().toString('utf8'));

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

            try {
                packageJson = JSON.parse(fs.readFileSync(path.join(repoPath, 'package.json'), 'utf8'));
            } catch (readError) {
                logger.error("Error reading package.json", {
                    Path: path.join(repoPath, 'package.json'),
                    Error: readError.message
                });
                return res.status(500).send({message: "Error reading package.json"});
            }
            
        } else {
            logger.warn("Invalid request: No package content or URL provided");
            return res.status(400).send({message: "No package content or URL provided"});
        }

        // Extract package name and version from package.json



        packageName = packageJson.name;
        packageVersion = packageJson.version;
        logger.debug(`Extracted package info: Name - ${packageName}, Version - ${packageVersion}`);

        // Check if the package already exists
        const packageExists = await checkIfPackageExists(packageName, packageVersion);
        if (packageExists) {
            logger.warn(`Package already exists: ${packageName}, Version: ${packageVersion}`);
            return res.status(409).send({message: "Package already exists"});
        }

        const packageId = shortid.generate();
        logger.debug(`Generated unique package ID: ${packageId}`);


        // adding rating
        if(req.body.URL){

            const gitHubURL = req.body.URL;
            const tempFilePath = path.join(os.tmpdir(), `${packageId}-urls.txt`);
        

            try {
                fs.writeFileSync(tempFilePath, gitHubURL + '\n');
           
            } catch (err) {
                logger.error("Error writing to file", { Error: err.message });
                return res.status(500).send({ message: "Error writing to file" });
            }
    
            try {
                const scores = await get_metric_scores(tempFilePath);
                const isAnyScoreAboveThreshold = scores.some(score => {
                    return score.NET_SCORE > 0.5 ||
                           score.RAMP_UP_SCORE > 0.5 ||
                           score.CORRECTNESS_SCORE > 0.5 ||
                           score.BUS_FACTOR_SCORE > 0.5 ||
                           score.RESPONSIVE_MAINTAINER_SCORE > 0.5 ||
                           score.LICENSE_SCORE > 0.5 ||
                           score.PINNED_FRAC_SCORE > 0.5 ||
                           score.REVIEWED_FRAC_SCORE > 0.5;
                });
                
                if (!isAnyScoreAboveThreshold) {
                    // No score is high enough, reject the upload
                    return res.status(424).send({ message: "Package is not uploaded due to the disqualified rating" });
                }
            } catch (scoreError) {
                logger.error("Error calculating package score", { Error: scoreError.message });
                return res.status(500).send({ message: "Error calculating package score" });
            }
        
        }
        // fix end for rating


        // Find the first .md file instead of specifically a README.md
        const mdFiles = glob.sync(path.join(repoPath, '**/*.md')); // Use glob to search for .md files

        if (mdFiles.length === 0) {
            logger.error(".md file not found in the repository");
            return res.status(500).send({ message: ".md file not found in the repository" });
        }
     

        const mdFilePath = mdFiles[0]; // Take the first .md file found
        logger.debug(`.md file found at: ${mdFilePath}`);
        
        let mdContent;
        try {
            mdContent = fs.readFileSync(mdFilePath, 'utf8');
        } catch (readError) {
            logger.error("Error reading .md file", { Path: mdFilePath, Error: readError.message });
            return res.status(500).send({ message: "Error reading .md file" });
        }

        try {
            const mdS3Params = {
                Bucket: '461zips',
                Key: `readme/${packageName}-${packageVersion}.md`,
                Body: mdContent,
                Metadata: { 'name': packageName, 'version': packageVersion, 'id': packageId }
            };

            logger.debug("Starting S3 upload for .md file", { Bucket: mdS3Params.Bucket, Key: mdS3Params.Key });
            await s3.upload(mdS3Params).promise();
            logger.debug(".md file S3 upload successful");

        } catch (readError) {
            logger.error("Error reading or uploading .md file", { Path: mdEntry.entryName, Error: readError.message });
            return res.status(500).send({ message: "Error reading package.json" }); // Update this error message as needed
        }


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


async function checkIfPackageExists(packageName, packageVersion) {
    const scanParams = {
        TableName: 'S3Metadata',
        FilterExpression: "#pkgName = :nameVal and version = :versionVal",
        ExpressionAttributeNames: {"#pkgName": "name"},
        ExpressionAttributeValues:  {":nameVal": packageName, ":versionVal": packageVersion}

    };

    try {
        logger.debug("Executing DynamoDB Scan with params:", scanParams);
        const result = await dynamoDB.scan(scanParams).promise();
        logger.debug("DynamoDB Scan result:", result);
        return result.Items.length > 0;
    } catch (error) {
        logger.error("Error querying DynamoDB", {Error: error.message, Params: scanParams});
        throw new Error("Failed to query DynamoDB");
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

        // update the readme content (probably might need fixing)
        const base64Content = data.Content;
        const zipBuffer = Buffer.from(base64Content, 'base64');
        const zip = new AdmZip(zipBuffer);

        // Extract and update the .md file in S3
        const readmeEntry = zip.getEntries().find(entry => entry.entryName.endsWith('.md'));
        if (readmeEntry) {
            const readmeContent = readmeEntry.getData().toString('utf8');
            const readmeS3Key = `readmes/${metadata.Name}-${metadata.Version}.md`;
            const readmeUpdateParams = {
                Bucket: '461zips',
                Key: readmeS3Key,
                Body: readmeContent,
                Metadata: {
                    'name': metadata.Name,
                    'version': metadata.Version,
                    'id': metadata.ID
                }
            };

            await s3.upload(readmeUpdateParams).promise();
            console.log("README updated in S3")
            logger.debug("README updated in S3");
        } else {
            logger.warn("No .md file found in the package");
        }
    // end of readme update

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
        let scanParams = {
            TableName: "S3Metadata",
            ProjectionExpression: "#n, #v",
            ExpressionAttributeNames: {
                "#n": "name", // Using a placeholder for the reserved keyword 'name'
                "#v": "version" // Assuming 'version' is a top-level attribute and not reserved
            }
        };

        const allPackages = await dynamoDB.scan(scanParams).promise();
        console.log("Number of packages retrieved:", allPackages.Items.length);


        console.log("testing")



        const matchedPackages = [];

        for (const pkg of allPackages.Items) {
            try {
                // Check if package metadata is properly structured
                console.log("Package data:", pkg);

        
        
                console.log(`Processing package: ${pkg.name}-${pkg.version}`);
        
                // Construct the S3 key for the README file
                const readmeS3Key = `readme/${pkg.name}-${pkg.version}.md`;
        
                // Fetch the README file from S3
                let fetchedReadme;
                try {
                    fetchedReadme = await s3.getObject({
                        Bucket: '461zips',
                        Key: readmeS3Key
                    }).promise();
                } catch (s3Error) {
                    console.error("Error fetching README from S3:", s3Error);
                    continue;
                }
        
                let readmeContent = fetchedReadme.Body.toString('utf-8');
        
                // Check regex against both README and package name
                if (regex.test(readmeContent) || regex.test(pkg.name)) {
                    matchedPackages.push({
                        Version: pkg.version,
                        Name: pkg.name
                    });
                }
            } catch (error) {
                console.error("Error processing package:", error);

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

