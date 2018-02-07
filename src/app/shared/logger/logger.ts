import { CommonUtils } from "Utils/common-utils";

/**
 * window.logger wrapper that will print messages with this format:
 * <Timestamp> <LEVEL> (<Logger Name>): <message>
 */
export class Logger {
  logName: string;

  /**
   * @param logName the logger name that will be printed in console
   */
  constructor(logName: string) {
    if (!logName) {
      throw new Error("Inserire il nome del logger");
    }
    this.logName = logName;
  }

  /**
   * Directly call {@link window.console.group}
   */ 
  public group = function () {
    console.group();
  }
  
  /**
   * Directly call {@link window.console.groupEnd}
   */ 
  public groupEnd = function () {
    console.groupEnd();
  }

  /**
   * Use is equivalent to {@link window.console.debug}
   */ 
  public debug = function (...args: any[]) {
    if (args.length === 0) {
      return;
    }
    this._log("debug", args);
  }

  /**
   * Use is equivalent to {@link window.console.log}
   */ 
  public log = function (...args: any[]) {
    if (args.length === 0) {
      return;
    }
    this._log("log", args);
  }

  /**
   * Use is equivalent to {@link window.console.info}
   */ 
  public info = function (...args: any[]) {
    if (args.length === 0) {
      return;
    }
    this._log("info", args);
  }

  /**
   * Use is equivalent to {@link window.console.warn}
   */ 
  public error = function (...args: any[]) {
    if (args.length === 0) {
      return;
    }
    this._log("error", args);
  }

  /**
   * Use is equivalent to {@link window.console.warn}
   */ 
  public warn = function (...args: any[]) {
    if (args.length === 0) {
      return;
    }
    this._log("warn", args);
  }

  /**
   * Use {@link Logger.writeLog} to log messages on console
   * @param level log level (debug, warn, info, error, log)
   * @param args first arg is the message than the others are args passed to print into the message
   */
  private _log(level: string, args: any[]) {
    if (typeof args[0] === "string") {
      // first arg is the message
      let message = args[0];
      let nonMessageArgs = args.slice(1, args.length);
      this.writeLog(level, message, nonMessageArgs);
    } else {
      // no message as been passed
      this.writeLog(level, "", args);
    }
  }

  /**
   * Use window.console to log
   * @param level log level (debug, warn, info, error)
   * @param message message to log
   * @param params params passed to print into the message
   */
  private writeLog(level: string, message: string, params: Array<any>) {
    params = [this.head(level) + message].concat(params);
    console[level].apply(null, params);
  }

  /**
   * @returns A timestamp with this format dd/MM/yyyy HH:mm:ss:SSS
   */
  private date(): string {
    let d = new Date();
    return CommonUtils.leftPad(String(d.getDate()), 2) + "/" +
      CommonUtils.leftPad(String(d.getMonth() + 1), 2) + "/" + CommonUtils.leftPad(String(d.getFullYear()), 4) + " " +
      CommonUtils.leftPad(String(d.getHours()), 2) + ":" + CommonUtils.leftPad(String(d.getMinutes()), 2) + ":" +
      CommonUtils.leftPad(String(d.getSeconds()), 2) + ":" + CommonUtils.leftPad(String(d.getMilliseconds()), 3);
  }

  /**
   * Return header for console logs: <Timestamp> <LEVEL> (<Logger Name>): <message>
   * @param level 
   */
  private head(level: string) {
    return this.date() + " " + level.toUpperCase() + " (" + this.logName + "): ";
  }
}