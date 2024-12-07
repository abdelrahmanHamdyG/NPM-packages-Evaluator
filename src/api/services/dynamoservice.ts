import { DynamoDBClient, PutItemCommand, GetItemCommand, ScanCommand, DeleteItemCommand, UpdateItemCommand } from '@aws-sdk/client-dynamodb';
import semver from 'semver';
import {QueryCommand, QueryCommandInput, QueryCommandOutput } from "@aws-sdk/client-dynamodb";

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

        const regexPattern = new RegExp(regex, 'i'); // Case-insensitive regex

        return response.Items.filter((item) => {
            const name = item.name?.S || '';       // Safe access to 'name'
            const readme = item.readme?.S || '';   // Safe access to 'readme'
            return regexPattern.test(name) || regexPattern.test(readme); // Match against both fields
        }).map((item) => ({
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
                console.log('Processing query:', query);

                // Validate semver range
                if (!semver.validRange(query.Version)) {
                    console.warn('Invalid semver range in query:', query.Version);
                    return [];
                }

                // DynamoDB scan command
                const command = new ScanCommand({
                    TableName: 'Packages',
                });

                console.log('Executing ScanCommand:', command);

                // Fetch response from DynamoDB
                const response = await dynamo.send(command);
                console.log('DynamoDB response:', JSON.stringify(response.Items, null, 2));

                if (!response.Items || response.Items.length === 0) {
                    console.warn('No items found for query:', JSON.stringify(query));
                    return [];
                }

                // Filter packages based on query criteria
                const filteredPackages = response.Items.filter((pkg) => {
                    const version = pkg.version?.S;
                    const name = pkg.name?.S;

                    // Check name match
                    if (name !== query.Name) {
                        console.warn('Name mismatch in item:', { expected: query.Name, actual: name });
                        return false;
                    }

                    // Check version validity and match
                    if (!version || !semver.valid(version)) {
                        console.warn('Invalid or missing semver version in item:', { version });
                        return false;
                    }

                    if (!semver.satisfies(version, query.Version)) {
                        console.warn('Version does not satisfy semver range in item:', { version, range: query.Version });
                        return false;
                    }

                    return true;
                });

                console.log('Filtered packages:', filteredPackages);

                // Map filtered packages to required format
                return filteredPackages.map((pkg) => ({
                    Version: pkg.version?.S || 'unknown',
                    Name: pkg.name?.S || 'unknown',
                    Id: pkg.id?.S || 'unknown',
                }));
            })
        );

        const allPackages = results.flat();
        console.log(`Total packages matching query: ${allPackages.length}`);

        if (allPackages.length === 0) {
            console.error('No packages found matching the query. Returning 404 error.');
            const error = new Error('Package not found');
            (error as any).statusCode = 404; // Assign statusCode for custom error handling
            throw error; // Throw the error to propagate it to the controller
        }

        // Pagination logic
        const paginatedPackages = allPackages.slice(startIndex, startIndex + pageSize);
        const nextOffset =
            paginatedPackages.length < pageSize ? '' : (startIndex + pageSize).toString();

        return {
            packages: paginatedPackages,
            nextOffset,
        };
    } catch (error: unknown) {
        console.error('Error scanning packages from DynamoDB:', error);

        // If a custom error with statusCode is caught, propagate it
        if (error instanceof Error && (error as any).statusCode) {
            throw error;
        }

        // Wrap other errors into a generic internal server error
        const internalError = new Error('Internal Server Error');
        (internalError as any).statusCode = 500;
        throw internalError;
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
        console.log('Registry has been cleared in DynamoDB.');
    } catch (error) {
        console.error('Error clearing registry in DynamoDB:', error);
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