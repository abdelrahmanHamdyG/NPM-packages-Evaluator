import { DynamoDBClient, PutItemCommand, GetItemCommand, ScanCommand } from '@aws-sdk/client-dynamodb';
import semver from 'semver';


// Initialize DynamoDB client
const dynamo = new DynamoDBClient({ region: 'us-east-2' });

export interface Module {
    id: string;
    name: string;
    version: string;
    s3Key: string;
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

        return {
            id: response.Item.id.S,
            name: response.Item.name.S,
            version: response.Item.version.S,
            s3Key: response.Item.s3Key.S,
            packageUrl: response.Item.url.S
        };
    } catch (error) {
        console.error('Error fetching package from DynamoDB:', error);
        throw error;
    }
};
export const getPackagesFromDynamoDB = async (
    queries:{ Name: string, Version: string }[],
    offset: string = '0',
    limit: number = 10
) => {
    // Convert offset to an integer and set a default value if it's invalid
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
                    const version = pkg.version.S; // Ensure this matches your DynamoDB schema
                    // Ensure that version is defined before calling semver.satisfies
                    if (version && semver.satisfies(version, query.Version)) {
                        return true;
                    }
                    return false;

                });
                

                // Map the results to match the expected format
                return filteredPackages.map((pkg) => ({
                    id: pkg.id.S,
                    name: pkg.name.S,
                    version: pkg.version.S,
                    s3Key: pkg.s3Key.S,
                }));
            })
        );

        // Flatten results and apply pagination
        const allPackages = results.flat();
        const paginatedPackages = allPackages.slice(startIndex, startIndex + pageSize);

        // Set the next offset for pagination
        const nextOffset =
            paginatedPackages.length < pageSize ? '' : (startIndex + pageSize).toString();

        return {
            packages: paginatedPackages,
            nextOffset,
        };
    } catch (error: unknown) {
        // Type narrowing for error
        if (error instanceof Error) {
            console.error('Error scanning packages from DynamoDB:', error.message);
        } else {
            console.error('Unknown error scanning packages:', error);
        }
        throw error;
    }
};