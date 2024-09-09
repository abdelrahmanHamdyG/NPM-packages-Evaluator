import { API } from "./API.js";
import { NPMData } from "./NPMData.js";

export class NpmAPI extends API{
    private packageName: string;

    constructor(packageName: string) {
        super();
        this.packageName = packageName;
    }

    public async fetchData(): Promise <void | NPMData>{
        const url = `https://api.npms.io/v2/package/${this.packageName}`;

        try {
            this.logger.log(1, "Fetching data from NPM");
            this.logger.log(2, 
                `Fetching data for package: ${this.packageName}`);

            const response = await fetch(url);
            const data = await response.json();
            const metadata = data?.collected?.metadata;

            this.logger.log(2, "Successfully fetched data from NPM");
            return new NPMData(metadata.license, metadata.repository.url);
        } catch (error) {
            if(error)
                this.logger.log(0, `Error fetching data: ${error}`);
        }
    }
}
