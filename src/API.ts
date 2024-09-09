import { Logger } from "./logger.js";

export abstract class API {
    protected logger: Logger;

    constructor() {
        this.logger = new Logger();
    }

    

    
}
