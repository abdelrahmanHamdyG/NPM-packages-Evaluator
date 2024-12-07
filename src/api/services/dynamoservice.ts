import { DynamoDBClient, PutItemCommand, GetItemCommand, ScanCommand, DeleteItemCommand, UpdateItemCommand } from '@aws-sdk/client-dynamodb';
import semver from 'semver';
import {QueryCommand, QueryCommandInput, QueryCommandOutput } from "@aws-sdk/client-dynamodb";
import { Logger } from "../../phase-1/logger.js";
const logger = new Logger();

// import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
// import { ScanCommand } from '@aws-sdk/lib-dynamodb';

// const dynamo = new DynamoDBClient({ region: 'your-region' });

// Your existing getPackagesFromDynamoDB function...

// Initialize DynamoDB client
const dynamo = new DynamoDBClient({ region: 'us-east-2' });
export interface Module {
    id: string;            // Unique identifier for the module
    name: string;          // Name of the package/module
    version: string;       // Version of the package/module
    s3Key: string;         // S3 key where the package is stored
    uploadType: string;    // Type of upload, e.g., "content" or "URL"
    packageUrl?: string;   // Optional: URL of the package (if applicable)
    createdAt?: string;    // Optional: Timestamp of creation
    jsProgram?: string;    // Optional: JavaScript program content, if applicable
    debloat?: boolean;
}
export interface PackageMetadata {
    Name: string;
    Version: string;
    ID: string;
}

export const addModuleToDynamoDB = async (module: Module) => {
    const item: Record<string, any> = {
        id: { S: module.id },
        name: { S: module.name },
        version: { S: module.version },
        s3Key: { S: module.s3Key },
        uploadType: { S: module.uploadType }, // Ensure uploadType is saved
    };

    // Conditionally add packageUrl if it exists
    if (module.packageUrl) {
        item.packageUrl = { S: module.packageUrl };
    }

    const command = new PutItemCommand({
        TableName: 'Packages',
        Item: item,
    });

    try {
        await dynamo.send(command);
        console.log('Module metadata added to DynamoDB:', module);
    } catch (error) {
        console.error('Error adding module to DynamoDB:', error);
        throw error;
    }
};

export const getPackageFromDynamoDB = async (id: string) => {
    const command = new GetItemCommand({
        TableName: 'Packages',
        Key: {
            id: { S: id },
        },
    });

    try {
        const response = await dynamo.send(command);

        // Check if the item exists in the response
        if (!response.Item) {
            console.error('Package not found in DynamoDB for ID:', id);
            return null; // Return null if no item is found
        }

        // Safely access attributes and provide default values if undefined
        const item = response.Item;

        return {
            id: item.id?.S || 'unknown-id',
            name: item.name?.S || 'unknown-name',
            version: item.version?.S || '0.0.0',
            s3Key: item.s3Key?.S || 'unknown-s3Key',
            packageUrl: item.packageUrl?.S || undefined, // Optional field
            uploadType: item.uploadType?.S || 'unknown-uploadType', // Ensure uploadType is
        };
    } catch (error) {
        console.error('Error fetching package from DynamoDB:', error);
        throw error; // Re-throw the error for higher-level handling
    }
};

export const getPackagesByRegex = async (regex: string): Promise<PackageMetadata[]> => {
    const command = new ScanCommand({
        TableName: 'Packages',
    });

    try {
        const response = await dynamo.send(command);

        if (!response.Items) {
            return [];
        }

        // Compile regex safely and handle invalid patterns
        let regexPattern: RegExp;
        try {
            regexPattern = new RegExp(`^${regex}$`, 'i'); // Anchors ensure exact matches
        } catch (err) {
            console.error('Invalid regex provided:', regex, err);
            throw new Error('Invalid regex pattern');
        }

        // Filter items using regex
        const filteredItems = response.Items.filter((item) => {
            const name = item.name?.S || '';       // Safe access to 'name'
            const readme = item.readme?.S || '';   // Safe access to 'readme'

            try {
                // Test both 'name' and 'readme' fields against the regex
                const nameMatches = regexPattern.test(name);
                const readmeMatches = regexPattern.test(readme);
                return nameMatches || readmeMatches;
            } catch (err) {
                console.error('Error testing regex against item:', { name, readme }, err);
                return false; // Exclude items with matching errors
            }
        });

        // Map the filtered items to the desired output format
        return filteredItems.map((item) => ({
            Name: item.name?.S || 'Unknown',
            Version: item.version?.S || '0.0.0',
            ID: item.id?.S || 'unknown-id',
        }));
    } catch (error) {
        console.error('Error fetching packages by regex:', error);
        throw error;
    }
};

export const getPackagesFromDynamoDB = async (
    queries: { Name: string; Version: string }[],
    offset: string = '0',
    limit: number = 10
) => {
    const startIndex = parseInt(offset, 10) || 0;
    const pageSize = limit;

    try {
        const results = await Promise.all(
            queries.map(async (query) => {
                // Log query parameters
                console.log('Processing query:', query);

                // if (!semver.validRange(query.Version)) {
                if (query.Version && !semver.validRange(query.Version)) {
                    console.warn('Invalid semver range in query:', query.Version);
                    return [];
                }

                // Dynamically build FilterExpression
                const isWildcard = query.Name === '*';
                const hasVersion = !!query.Version;

                const command = new ScanCommand({
                    TableName: 'Packages',
                    FilterExpression: isWildcard
                        ? '#version <> :empty'
                        : hasVersion
                        ? '#name = :name AND #version <> :empty'
                        : '#name = :name',
                    ExpressionAttributeNames: isWildcard
                        ? { '#version': 'version' }
                        : hasVersion
                        ? { '#name': 'name', '#version': 'version' }
                        : { '#name': 'name' },
                    ExpressionAttributeValues: isWildcard
                        ? { ':empty': { S: '' } }
                        : hasVersion
                        ? { ':name': { S: query.Name }, ':empty': { S: '' } }
                        : { ':name': { S: query.Name } },
                });

                console.log('ScanCommand:', JSON.stringify(command));

                const response = await dynamo.send(command);
                console.log('DynamoDB response:', JSON.stringify(response.Items, null, 2));

                if (!response.Items || response.Items.length === 0) {
                    console.warn('No items found for query:', JSON.stringify(query));
                    return [];
                }

                const filteredPackages = response.Items.filter((pkg) => {
                    const version = pkg.version?.S;
                    const name = pkg.name?.S;

                    if (!version || !semver.valid(version)) {
                        console.warn('Invalid or missing semver version in item:', pkg);
                        return false;
                    }

                    if (isWildcard) {
                        // If Name is "*" and Version is undefined, we only care about the name matching
                        if (query.Version === undefined) {
                            return true; // We only care about the name being present
                        }
                        // If there is a version provided with the wildcard, apply version filtering
                        return semver.satisfies(version, query.Version) && name;
                    } else if (query.Version) {
                        // Match both version and name for non-wildcard queries
                        return semver.satisfies(version, query.Version) && name === query.Name;
                    }
                    else {
                        return name === query.Name;
                    }
                });

                console.log('Filtered packages:', filteredPackages);

                return filteredPackages.map((pkg) => ({
                    Version: pkg.version?.S || 'unknown',
                    Name: pkg.name?.S || 'unknown',
                    ID: pkg.id?.S || 'unknown',
                }));
            })
        );

        const allPackages = results.flat();
        console.log(`Total packages matching query: ${allPackages.length}`);

        const paginatedPackages = allPackages.slice(startIndex, startIndex + pageSize);
        const nextOffset =
            paginatedPackages.length < pageSize ? '' : (startIndex + pageSize).toString();

        return {
            packages: paginatedPackages,
            nextOffset,
        };
    } catch (error: unknown) {
        if (error instanceof Error) {
            console.error('Error scanning packages from DynamoDB:', error.message);
        } else {
            console.error('Unknown error scanning packages:', error);
        }
        throw error;
    }
};


// Clear all entries in the Packages table
export const clearRegistryInDynamoDB = async () => {
    const scanCommand = new ScanCommand({
        TableName: 'Packages',
    });

    try {
        // Fetch all items from the Packages table
        const scanResponse = await dynamo.send(scanCommand);
        if (!scanResponse.Items) return;

        // Delete each item individually
        const deletePromises = scanResponse.Items.map((item) => {
            const deleteCommand = new DeleteItemCommand({
                TableName: 'Packages',
                Key: {
                    id: item.id,
                },
            });
            return dynamo.send(deleteCommand);
        });

        await Promise.all(deletePromises);
        logger.log(1, 'Registry has been cleared in DynamoDB.');
    } catch (error) {
        logger.log(1, `Error clearing registry in DynamoDB: ${error}`);
        throw error;
    }
};


// Function to add data to DynamoDB
export const updateDynamoPackagedata = async (
    metadata: PackageMetadata): Promise<string | null> => {
    // The table name should match your DynamoDB table's name
    const tableName = 'Packages';

    // Create the PutItemCommand with metadata and rating
    const command = new PutItemCommand({
        TableName: tableName,
        Item: {
            id: { S: metadata.ID },  // ID as string
            name: { S: metadata.Name },  // Name as string
            version: { S: metadata.Version },  // Version as string
        },
    });

    try {
        // Send the command to DynamoDB to insert the item
        await dynamo.send(command);
        console.log('Package metadata added to DynamoDB:', metadata);

        // Return the package ID
        return metadata.ID;
    } catch (error) {
        console.error('Error adding package to DynamoDB:', error);
        return null;
    }
};