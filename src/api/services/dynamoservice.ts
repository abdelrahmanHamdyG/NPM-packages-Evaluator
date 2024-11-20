import { DynamoDBClient, PutItemCommand, GetItemCommand, ScanCommand } from '@aws-sdk/client-dynamodb';


// Initialize DynamoDB client
const dynamo = new DynamoDBClient({ region: 'us-east-2' });

export interface Module {
    id: string;
    name: string;
    version: string;
    s3Key: string;
    cost: number;
}

export const addModuleToDynamoDB = async (module: Module) => {
    const command = new PutItemCommand({
        TableName: 'Packages',
        Item: {
            id: { S: module.id },
            name: { S: module.name },
            version: { S: module.version },
            s3Key: { S: module.s3Key },
            cost: { N: module.cost.toString()},
        }
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
    queries: Module[],
    offset: string = '0',
    limit: number = 10
) => {
    // Convert offset to an integer and set a default value if it's invalid
    const startIndex = parseInt(offset, 10) || 0;
    const pageSize = limit;

    // Construct filter expressions for the DynamoDB scan query
    const filterExpressions = queries
        .map((query, idx) => {
            return `#name${idx} = :name${idx} AND #version${idx} = :version${idx}`;
        })
        .join(' OR ');

    // Dynamically create the expression attribute values and names
    let expressionValues: { [key: string]: { S: string } } = {};
    let expressionNames: { [key: string]: string } = {};

    queries.forEach((query, idx) => {
        expressionValues[`:name${idx}`] = { S: query.name };
        expressionValues[`:version${idx}`] = { S: query.version };
        expressionNames[`#name${idx}`] = 'name';
        expressionNames[`#version${idx}`] = 'version';
    });

    // Command to scan DynamoDB
    const command = new ScanCommand({
        TableName: 'Packages',
        FilterExpression: filterExpressions,
        ExpressionAttributeValues: expressionValues,
        ExpressionAttributeNames: expressionNames,
        ExclusiveStartKey: startIndex ? { id: { S: startIndex.toString() } } : undefined,
    });

    try {
        const response = await dynamo.send(command);

        if (!response.Items || response.Items.length === 0) {
            return { packages: [], nextOffset: '' };
        }

        // Paginate the results by slicing the array to the page size
        const paginatedPackages = response.Items.slice(startIndex, startIndex + pageSize);

        // Set the next offset for pagination (this would be the id of the last item in the page)
        const nextOffset =
            paginatedPackages.length < pageSize ? '' : (startIndex + pageSize).toString();

        // Map the results to match the expected format
        const packages = paginatedPackages.map((pkg) => ({
            id: pkg.id.S,
            name: pkg.name.S,
            version: pkg.version.S,
            s3Key: pkg.s3Key.S,
        }));

        return {
            packages,
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