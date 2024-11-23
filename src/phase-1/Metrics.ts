import { GitHubData } from "./GitHubData.js";
import { NPMData } from "./NPMData.js";

export class Metrics{

    protected githubData:GitHubData;
    protected npmData:NPMData;



    constructor(githubData:GitHubData,npmData:NPMData){

        this.githubData=githubData;
        this.npmData=npmData;
        
    }

    public async calculateLatency(): Promise<{ score: number; latency: number }> {
        const score=-1;
        const latency=-1;   
        return { score , latency };
    }


    public async calculateScore():Promise<number>{
        return 0;
    }


    
}