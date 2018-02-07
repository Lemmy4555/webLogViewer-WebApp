import { Component } from "@angular/core";
import { Logger } from "Logger/logger";

@Component({
  selector: "file-path-input-text",
  templateUrl: "./file-path-input-text.component.html",
  styleUrls: ["./file-path-input-text.component.css"]
})
export class FilePathInputText {
  /*
   * WIN: (^([a-z]|[A-Z]):(?=\\(?![\0-\37<>:"/\\|?*])|\/(?![\0-\37<>:"/\\|?*])|$)|^\\(?=[\\\/][^\0-\37<>:"/\\|?*]+))((\\|\/)[^\0-\37<>:"/\\|?*]+|(\\|\/)$)*()$
   * UNIX: ^\/$|^(\/[^/\0]+)+\/?$
   */
  private regexFilePath: RegExp = /(^([a-z]|[A-Z]):(?=\\(?![\0-\37<>:"/\\|?*])|\/(?![\0-\37<>:"/\\|?*])|$)|^\\(?=[\\\/][^\0-\37<>:"/\\|?*]+))((\\|\/)[^\0-\37<>:"/\\|?*]+|(\\|\/)$)*()$|^\/$|^(\/[^/\0]+)+\/?$/g;
  private logger: Logger = new Logger(this.constructor.name);
  private path: string = "";
  private error: string = "";

  private _onPathInsert: (path: string) => void = () => {};

  private onKeyUp(event: KeyboardEvent, value: string) {
    this.path = value;
    if (this.path) {
      if (this.isValidPath(this.path)) {
        this.hideError();
        if (event.keyCode == 13) {
          this._onPathInsert(this.path);
        }
      } else {
        this.displayError("Il path inserito non e valido");
      }
    } else {
      this.hideError();
    }
  }

  private isValidPath(path: string) {
    if (!path || typeof path !== "string") {
      return false;
    }
    //Resetta l'index della regex per evitare che il risultato si alterni (true, false, true, false, etc..)
    this.regexFilePath.lastIndex = 0
    return this.regexFilePath.test(path);
  }

  private displayError(message: string) {
    this.error = message;
  }

  private hideError() {
    this.error = "";
  }

  public onPathInsert = function (callback: (path: string) => void): FilePathInputText {
    this._onPathInsert = callback;
    return this;
  }
}
