import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

export class Logger {
  private logFilePath: string;
  private logLevel: number;

  constructor() {
    this.logFilePath =process.env.LOG_FILE as string; 
    this.logLevel = this.getLogLevel();
    this.ensureLogFileExists();
  }

  private getLogLevel(): number {
    const level = parseInt(process.env.LOG_LEVEL as string);
    
    return level;
  }

  private ensureLogFileExists():void {
    const dir = path.dirname(this.logFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(this.logFilePath)) {
      fs.writeFileSync(this.logFilePath, "", "utf-8");
    }
  }

  private formatMessage(level: string, message: string): string {
    const timestamp = new Date().toISOString();
    return `${timestamp} [${level}]: ${message}\n`;
  }

  public log(level: number, message: string):void {
    if (level<= this.logLevel) {
      const levelString = this.getLevelString(level);
      const formattedMessage = this.formatMessage(levelString, message);
      fs.appendFileSync(this.logFilePath, formattedMessage, "utf-8");
    }
  }

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


