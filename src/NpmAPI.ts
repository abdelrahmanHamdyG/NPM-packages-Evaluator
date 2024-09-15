import { API } from "./API.js";

import { NPMData } from "./NPMData.js";

export class NpmAPI extends API{
    private packageName: string;

    constructor(packageName: string) {
        super();
        this.packageName = packageName;
    }

    public async fetchData(): Promise < NPMData>{
        const url = `https://api.npms.io/v2/package/${this.packageName}`;

        try {
            this.logger.log(2, 
                `Fetching data for package: ${this.packageName}`);
            
            const response = await fetch(url);
            const data = await response.json();
            const metadata = data?.collected?.metadata;
            this.logger.log(2, `Successfully fetched data from NPM for the url ${url}`);
            return new NPMData(metadata.license, metadata.links.repository);
        } catch (error) {
            if(error)
                this.logger.log(2, `Error fetching data: ${error}`);
        }
        return new NPMData();
    }
}
