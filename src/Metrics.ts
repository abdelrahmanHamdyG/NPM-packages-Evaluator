import { PackageData } from "./PackageData";

export class Metrics{


    packageData:PackageData;

    constructor(packageData:PackageData){

        this.packageData=packageData;
    }

    public calculateLatency():number{

        return 0;
    }

    public calculateScore(packageData:PackageData):number{

        console.log(packageData.name);
        return 0;

    }


}