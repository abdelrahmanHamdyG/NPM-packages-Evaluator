import { DynamoDBClient, PutItemCommand, GetItemCommand, ScanCommand, DeleteItemCommand, UpdateItemCommand } from '@aws-sdk/client-dynamodb';
import semver from 'semver';
import { DeleteItemCommand } from '@aws-sdk/client-dynamodb';



// Initialize DynamoDB client
const dynamo = new DynamoDBClient({ region: 'us-east-2' });

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
    const item: Record<string, any> = {
        id: { S: module.id },
        name: { S: module.name },
        version: { S: module.version },
        s3Key: { S: module.s3Key },
        uploadType: { S: module.uploadType }, // Save upload type
    };

    // Conditionally add packageUrl if it is not undefined
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
        TableName: 'Packages', // Replace with your actual DynamoDB table name
        Key: {
            id: { S: id },
        },
    });

    try {
        const response = await dynamo.send(command);

        if (!response.Item) {
            console.error('Package not found in DynamoDB.');
            return null; // Return null if the item doesn't exist
        }

        // Safely access attributes and provide default values if missing
        return {
            id: response.Item.id.S,
            name: response.Item.name.S,
            version: response.Item.version.S,
            s3Key: response.Item.s3Key.S,
            packageUrl: response.Item.packageUrl.S
        };
    } catch (error) {
        console.error('Error fetching package from DynamoDB:', error);
        throw error; // Re-throw the error for higher-level handling
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
export const getPackagesFromDynamoDB = async (
    queries: { Name: string; Version: string }[],
    offset: string = '0',
    limit: number = 10
) => {
    // Convert offset to an integer
    const startIndex = parseInt(offset, 10) || 0;
    const pageSize = limit;

    try {
        // Fetch all potential matches for the given queries
        const results = await Promise.all(
            queries.map(async (query) => {
                // Command to scan DynamoDB for packages matching the name
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
                    return [];
                }

                // Filter packages by version using semver
                const filteredPackages = response.Items.filter((pkg) => {
                    const version = pkg.version.S;
                    return version && semver.satisfies(version, query.Version);
                });

                // Map to Module type
                return filteredPackages.map((pkg) => ({
                    id: pkg.id.S,
                    name: pkg.name.S,
                    version: pkg.version.S,
                    s3Key: pkg.s3Key.S,
                    uploadType: pkg.uploadType.S, // Include uploadType
                    packageUrl: pkg.packageUrl?.S, // Include optional packageUrl
                }));
            })
        );

        // Flatten results and paginate
        const allPackages = results.flat();
        const paginatedPackages = allPackages.slice(startIndex, startIndex + pageSize);

        // Set next offset for pagination
        const nextOffset = paginatedPackages.length < pageSize ? '' : (startIndex + pageSize).toString();

        return {
            packages: paginatedPackages,
            nextOffset,
        };
    } catch (error) {
        console.error('Error scanning packages from DynamoDB:', error);
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
