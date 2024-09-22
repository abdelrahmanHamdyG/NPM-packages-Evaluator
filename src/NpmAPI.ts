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
        const start=performance.now();

        try {
            this.logger.log(1, "Fetching data from NPM");
            this.logger.log(2,`Fetching data for package: ${this.packageName}`);
            
            const response = await fetch(url);
            const data = await response.json();

            const end=performance.now();
            const latency=end-start;
            const latestVersion = data["dist-tags"].latest;
            const versionData = data.versions[latestVersion];
            this.logger.log(2,latestVersion);
            const license = versionData?.license ;
            const repository = versionData?.repository;
            const repoUrl = repository?.url;
            let extractedUrl = repoUrl.slice(4, -4);
            if (!extractedUrl.startsWith("https")&&extractedUrl.length!==0) {
                extractedUrl = `https:${extractedUrl}`;
                return new NPMData(license, extractedUrl,latency);
            }
            else{
                return new NPMData(license, extractedUrl,latency);  
            }
            

            
        } catch (error) {
            if(error)
                this.logger.log(2, `Error fetching data: ${error}`);
        }
        return new NPMData();
    }
}