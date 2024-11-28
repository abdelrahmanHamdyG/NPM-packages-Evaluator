import { DynamoDBClient, PutItemCommand, GetItemCommand, ScanCommand, DeleteItemCommand, UpdateItemCommand } from '@aws-sdk/client-dynamodb';
import semver from 'semver';
import AWS from 'aws-sdk';
import { GetCommand, DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
// Initialize DynamoDB client
const dynamo = new DynamoDBClient({ region: 'us-east-2' });
// const client = new DynamoDBClient({ region: dynamo });
// const dynamoDBDocumentClient = DynamoDBDocumentClient.from(client);

export interface Module {
    id: string;
    name: string;
    version: string;
    s3Key: string;
}
export interface PackageMetadata {
    Name: string;
    Version: string;
    ID: string;
}

export const addModuleToDynamoDB = async (module: Module) => {
    const command = new PutItemCommand({
        TableName: 'Packages',
        Item: {
            id: { S: module.id },
            name: { S: module.name },
            version: { S: module.version },
            s3Key: { S: module.s3Key },
        },
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
            id: { S: id }
        }
    });

    try {
        const response = await dynamo.send(command);
        if (!response.Item) return null;

        // Parse dependencies and determine if the package has dependencies
        const dependencyList = response.Item.dependencies?.SS || [];
        const hasDependencies = dependencyList.length > 0;
        return {
            id: response.Item.id.S,
            name: response.Item.name.S,
            version: response.Item.version.S,
            s3Key: response.Item.s3Key.S,
            packageUrl: response.Item.packageUrl.S,
            // id: response.Item.id?.S || null,               // Fallback to null if `id` is missing
            // name: response.Item.name?.S || 'Unknown',     // Fallback to 'Unknown' if `name` is missing
            // version: response.Item.version?.S || '0.0.0', // Fallback to a default version
            // s3Key: response.Item.s3Key?.S || '',          // Fallback to an empty string
            // packageUrl: response.Item.url?.S || '',       // Fallback to an empty string
            hasDependencies: dependencyList.length > 0,
            dependencies: dependencyList,                 // Returns an empty array if no dependencies
        };
    } catch (error) {
        console.error('Error fetching package from DynamoDB:', error);
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
                const command = new ScanCommand({
                    TableName: 'Packages',
                    FilterExpression: '#name = :name',
                    ExpressionAttributeNames: {
                        '#name': 'name',
                    },
                    ExpressionAttributeValues: {
                        ':name': { S: query.Name },
                    },
                });

                const response = await dynamo.send(command);

                if (!response.Items || response.Items.length === 0) {
                    console.warn('No items found for query:', JSON.stringify(query));
                    return [];
                }

                const filteredPackages = response.Items.filter((pkg) => {
                    const version = pkg.version?.S;
                    return version && semver.satisfies(version, query.Version);
                });

                return filteredPackages.map((pkg) => ({
                    id: pkg.id?.S || 'unknown',
                    name: pkg.name?.S || 'unknown',
                    version: pkg.version?.S || 'unknown',
                    s3Key: pkg.s3Key?.S || '',
                }));
            })
        );

        const allPackages = results.flat();
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
