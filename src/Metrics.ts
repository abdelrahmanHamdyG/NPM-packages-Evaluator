import { GitHubData } from "./GitHubData";

export class Metrics{


    packageData:GitHubData;

    constructor(packageData:GitHubData){

        this.packageData=packageData;
    }

    public calculateLatency():number{

        return 0;
    }

    public calculateScore(packageData:GitHubData):number{

        console.log(packageData.name);
        return 0;

    }


}