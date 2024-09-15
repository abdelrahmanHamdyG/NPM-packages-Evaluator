import { GitHubData } from "./GitHubData.js";
import { NPMData } from "./NPMData.js";

export class Metrics{

    protected githubData:GitHubData;
    protected npmData:NPMData;



    constructor(githubData:GitHubData,npmData:NPMData){

        this.githubData=githubData;
        this.npmData=npmData;
        
    }

    public calculateLatency():number{
        return 0;
    }


    public calculateScore(packageData:GitHubData):number{
        console.log(packageData.name);
        return 0;
    }


    
}