import { API } from "./API.js";

import { NPMData } from "./NPMData.js";

export class NpmAPI extends API{
    private packageName: string;

    constructor(packageName: string) {
        super();
        this.packageName = packageName;
    }

    public async fetchData(): Promise < NPMData>{
        const url = `https://registry.npmjs.org/${this.packageName}`;

        try {
            this.logger.log(1, "Fetching data from NPM");
            this.logger.log(2,`Fetching data for package: ${this.packageName}`);
            
            const response = await fetch(url);
            const data = await response.json();

            
            const latestVersion = data["dist-tags"].latest;
            const versionData = data.versions[latestVersion];
            this.logger.log(3,latestVersion);
            const license = versionData?.license ;
            const repository = versionData?.repository;
            let repoUrl = repository?.url;
            let extractedUrl = repoUrl.slice(4, -4);
            if (!extractedUrl.startsWith('https')&&extractedUrl.length!=0) {
                extractedUrl = `https:${extractedUrl}`;
                return new NPMData(license, extractedUrl);
            }
            else{
                return new NPMData(license, extractedUrl);  
            }
            

            
        } catch (error) {
            if(error)
                this.logger.log(0, `Error fetching data: ${error}`);
        }
        return new NPMData();
    }
}