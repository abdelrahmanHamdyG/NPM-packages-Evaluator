import { Logger } from "./logger";

export abstract class API {
    protected logger: Logger;

    constructor() {
        this.logger = new Logger();
    }



    
}
