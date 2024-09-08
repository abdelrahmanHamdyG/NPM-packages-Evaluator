import { PackageData } from "./PackageData";

export class Metrics{


    packageData:PackageData;

    constructor(packageData:PackageData){

        this.packageData=packageData;
    }

    public calculateLatency():number{

        return 0;
    }

    public calculateScore():number{


        return 0;

    }


}