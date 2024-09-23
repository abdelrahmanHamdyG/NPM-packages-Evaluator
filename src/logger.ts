import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

// Defining the Logger class to handle logging messages to a file
export class Logger {
  private logFilePath: string;
  private logLevel: number;

  // Initializing the logger with log file path and log level from environment variables
  constructor() {
    this.logFilePath =process.env.LOG_FILE as string; 
    this.logLevel = this.getLogLevel();
    this.ensureLogFileExists();
  }

  // Retrieving the log level from the environment variables
  private getLogLevel(): number {
    const level = parseInt(process.env.LOG_LEVEL as string);
    return level;
  }

  // Ensuring that the log file and its directory exist, creating them if necessary
  private ensureLogFileExists():void {
    const dir = path.dirname(this.logFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(this.logFilePath)) {
      fs.writeFileSync(this.logFilePath, "", "utf-8");
    }
  }

  // Formatting the log message with a timestamp and log level
  private formatMessage(level: string, message: string): string {
    const timestamp = new Date().toISOString();
    return `${timestamp} [${level}]: ${message}\n`;
  }

  // Logging the message to the file if the log level is sufficient
  public log(level: number, message: string):void {
    if (level <= this.logLevel) {
      const levelString = this.getLevelString(level);
      const formattedMessage = this.formatMessage(levelString, message);
      fs.appendFileSync(this.logFilePath, formattedMessage, "utf-8");
    }
  }

  // Mapping the log level number to a readable string
  private getLevelString(level: number): string {
    switch (level) {
      case 1:
        return "INFO";
      case 2:
        return "DEBUG";
      default:
        return "SILENT";
    }
  }
}
