import { CommonUtils } from "Util/common-utils";

export class Logger {
  logName: string;

  constructor(logName: string) {
    if (!logName) {
      throw new Error("Inserire il nome del logger");
    }
    this.logName = logName;
  }

  public group = function () {
    console.group();
  }

  public groupEnd = function () {
    console.groupEnd();
  }

  public debug = function (...args: any[]) {
    if (args.length === 0) {
      return;
    }
    this._log("debug", args);
  }

  public log = function (...args: any[]) {
    if (args.length === 0) {
      return;
    }
    this._log("log", args);
  }

  public info = function (...args: any[]) {
    if (args.length === 0) {
      return;
    }
    this._log("info", args);
  }

  public error = function (...args: any[]) {
    if (args.length === 0) {
      return;
    }
    this._log("error", args);
  }

  public warn = function (...args: any[]) {
    if (args.length === 0) {
      return;
    }
    this._log("warn", args);
  }

  private _log(level: string, args: any[]) {
    if (typeof args[0] === "string") {
      let message = args[0];
      let nonMessageArgs = args.slice(1, args.length);
      this.writeLog(level, message, nonMessageArgs);
    } else {
      this.writeLog(level, "", args);
    }
  }

  private writeLog(level: string, message: string, params: Array<any>) {
    params = [this.head(level) + message].concat(params);
    console[level].apply(null, params);
  }

  private findParamsSinceError(...args: any[]): Object {
    let error: Error = null;
    let params: Array<any> = [];
    args.forEach(function (e) {
      if (e instanceof Error) {
        error = e;
        return;
      } else {
        params.push(e);
      }
    });
    return {
      params: params,
      error: error
    }
  }

  private formatMessage(message: string, ...params: any[]) {
    /* Inverto la stringa per utilizzare il negative lookahead perche il negative lookbehind
      non e supportato da js */
    let reversed = this.reverseString(message);
    let regex = /\}\{(?!(\\))/g
    let i = 0;
    params.forEach(function (e) {
      let match = regex.exec(reversed);
      if (!match) {
        return;
      }
      let reversedParam = this.reverseString(new String(params[i]));
      reversed = reversed.substr(0, match.index) + reversedParam + reversed.substr(match.index + 2, reversed.length);
      i++;
    });
    return this.reverseString(reversed);
  }

  private reverseString(str: string) {
    // Step 1. Use the split() method to return a new array
    let splitString = str.split(""); // let splitString = "hello".split("");
    // ["h", "e", "l", "l", "o"]

    // Step 2. Use the reverse() method to reverse the new created array
    let reverseArray = splitString.reverse(); // let reverseArray = ["h", "e", "l", "l", "o"].reverse();
    // ["o", "l", "l", "e", "h"]

    // Step 3. Use the join() method to join all elements of the array into a string
    let joinArray = reverseArray.join(""); // let joinArray = ["o", "l", "l", "e", "h"].join("");
    // "olleh"

    //Step 4. Return the reversed string
    return joinArray; // "olleh"
  }

  private date() {
    let d = new Date();
    return CommonUtils.leftPad(String(d.getDate()), 2) + "/" +
      CommonUtils.leftPad(String(d.getMonth() + 1), 2) + "/" + CommonUtils.leftPad(String(d.getFullYear()), 2) + " " +
      CommonUtils.leftPad(String(d.getHours()), 2) + ":" + CommonUtils.leftPad(String(d.getMinutes()), 2) + ":" +
      CommonUtils.leftPad(String(d.getSeconds()), 2) + ":" + CommonUtils.leftPad(String(d.getMilliseconds()), 3);
  }

  private head(level: string) {
    return this.date() + " " + level.toUpperCase() + " (" + this.logName + "): ";
  }
}