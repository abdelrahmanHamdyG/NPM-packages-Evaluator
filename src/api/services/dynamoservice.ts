import { DynamoDBClient, PutItemCommand, GetItemCommand, ScanCommand } from '@aws-sdk/client-dynamodb';

const dynamo = new DynamoDBClient({ region: 'us-east-2' });

// Define TypeScript interfaces for type safety
interface Module {
    id: string;
    name: string;
    version: string;
    s3Key: string;
}

// Add a module to DynamoDB
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

// Retrieve a package by ID from DynamoDB
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
            id: response.Item.id.S!,
            name: response.Item.name.S!,
            version: response.Item.version.S!,
            s3Key: response.Item.s3Key.S!
        };
    } catch (error) {
        console.error('Error fetching package from DynamoDB:', error);
        throw error;
    }
};

// Save a package (alternative implementation of addModuleToDynamoDB)
export const savePackageToDynamoDB = async (packageData: Module): Promise<Module> => {
    const command = new PutItemCommand({
        TableName: 'Packages',
        Item: {
            id: { S: packageData.id },
            name: { S: packageData.name },
            version: { S: packageData.version },
            s3Key: { S: packageData.s3Key },
        }
    });

    try {
        await dynamo.send(command);
        console.log('Package saved to DynamoDB:', packageData);
        return packageData;
    } catch (error) {
        console.error('Error saving package to DynamoDB:', error);
        throw error;
    }
};

// Optional: Scan DynamoDB by regex (for a simple regex-like search)
export const searchPackagesByRegEx = async (pattern: RegExp): Promise<Module[]> => {
    const command = new ScanCommand({
        TableName: 'Packages'
    });

    try {
        const response = await dynamo.send(command);
        const items = response.Items || [];

        return items
            .map(item => ({
                id: item.id.S!,
                name: item.name.S!,
                version: item.version.S!,
                s3Key: item.s3Key.S!
            }))
            .filter(item => pattern.test(item.name) || pattern.test(item.version));
    } catch (error) {
        console.error('Error scanning packages by regex:', error);
        throw error;
    }
};
