import { DynamoDBClient, PutItemCommand, GetItemCommand, ScanCommand, DeleteItemCommand, UpdateItemCommand } from '@aws-sdk/client-dynamodb';

// Initialize DynamoDB client
const dynamo = new DynamoDBClient({ region: 'us-east-2' });

interface Module {
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

// Update package metadata in DynamoDB (e.g., update version or s3Key)
export const updatePackageInDynamoDB = async (id: string, updatedFields: Partial<Module>) => {
    const updateExpression = Object.keys(updatedFields)
        .map((key, index) => `#${key} = :value${index}`)
        .join(', ');

    const expressionAttributeNames: { [key: string]: string } = Object.keys(updatedFields).reduce((acc, key) => {
        acc[`#${key}`] = key;
        return acc;
    }, {} as { [key: string]: string });

    // Explicitly cast to string to ensure the correct type for DynamoDB
    const expressionAttributeValues: { [key: string]: { S: string } } = Object.keys(updatedFields).reduce((acc, key, index) => {
        const value = updatedFields[key as keyof Module];  // Get the value from updatedFields

        // Ensure that the value is a string, because DynamoDB expects { S: string }
        if (typeof value === 'string') {
            acc[`:value${index}`] = { S: value };
        } else {
            console.error(`Invalid value for ${key}: expected string, but got ${typeof value}`);
        }

        return acc;
    }, {} as { [key: string]: { S: string } });

    const command = new UpdateItemCommand({
        TableName: 'Packages',
        Key: {
            id: { S: id }
        },
        UpdateExpression: `SET ${updateExpression}`,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
    });

    try {
        await dynamo.send(command);
        console.log('Package metadata updated in DynamoDB:', id, updatedFields);
    } catch (error) {
        console.error('Error updating package in DynamoDB:', error);
        throw error;
    }
};