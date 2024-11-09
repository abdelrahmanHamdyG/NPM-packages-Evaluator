import { getPackageFromDynamoDB } from '../services/dynamoservice.js';

interface PackageData {
    id: string | undefined;
    cost?: number; // Make cost optional
    dependencies?: string[];
}

/**
 * Calculates the total cost of a package, including dependencies if specified.
 * 
 * @param {PackageData} packageData - Metadata of the main package.
 * @param {boolean} includeDependencies - Whether to include dependency costs.
 * @returns {Promise<number>} - The total cost of the package and its dependencies.
 */
export const calculateCostWithDependencies = async (packageData: PackageData, includeDependencies: boolean): Promise<number> => {
    // Use optional chaining and default to 0 if cost is missing
    const baseCost = packageData.cost ?? 0; // Default to 0 if cost is undefined
    let totalCost = baseCost;

    if (includeDependencies && packageData.dependencies && packageData.dependencies.length > 0) {
        const dependencyCosts = await Promise.all(
            packageData.dependencies.map(async (dependencyId: string): Promise<number> => {
                const dependencyData = await getPackageFromDynamoDB(dependencyId);

                // Use optional chaining and default to 0 if cost is missing
                return dependencyData?.cost ?? 0;
            })
        );

        totalCost += dependencyCosts.reduce((sum, cost) => sum + cost, 0);
    }

    return totalCost;
};