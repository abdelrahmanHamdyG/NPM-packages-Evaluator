import { Logger } from "./logger.js";

export abstract class API {
    protected logger: Logger;   // Logger instance to log messages

    constructor() {
        this.logger = new Logger();
    }



    
}
