import { GitHubData } from "./GitHubData.js";
import { NPMData } from "./NPMData.js";

// Defining the base Metrics class to provide common functionality for other metrics
export class Metrics{

    protected githubData:GitHubData;
    protected npmData:NPMData;

    // Initializing with GitHub and NPM data
    constructor(githubData:GitHubData,npmData:NPMData){

        this.githubData=githubData;
        this.npmData=npmData;
        
    }

    // Providing a default implementation for latency calculation
    public async calculateLatency(): Promise<{ score: number; latency: number }> {
        const score=-1; // Default score when not overridden
        const latency=-1; // Default latency when not overridden   
        return { score , latency };
    }

    // Providing a default implementation for score calculation
    public async calculateScore():Promise<number>{
        return 0; // Default score when not overridden
    }
}
