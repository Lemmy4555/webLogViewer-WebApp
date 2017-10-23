import { ErrorMessage } from './error-mgmt/error-message';
import { ErrorMessageModel } from './error-mgmt/error-message.model';
import { GenericResponse } from 'Services/api/response/generic-response-json';
export class CommonUtils {

  /**
    * Trasforma l'oggetto arguments di un metodo in un array contenente i singoli valori
    * @param {IArguments} inputArgs parametri di input del funzione chiamante
    * @param {number} [startSlice=0] index da cui prendere i parametri in poi
    * @return Se il primo valore di inputArgs e un array e la lunghezza dell'array e di un elemento
    *         verra tornato l'array, altrimenti verranno tornati tutti gli elementi di inputArgs a partire
    *         dall'elemento in posizione "startSlice"
    */
  static varArgsToArray(inputArgs: IArguments | Array<any>, startSlice: number = 0): Array<any> {
    if (!inputArgs) {
      return [];
    }
    if (!(inputArgs instanceof Array)) {
      inputArgs = Array.from(inputArgs);
    }

    var args = Array.prototype.slice.call(inputArgs, startSlice);
    if (args[0].constructor === Array && args.length === 1) {
      return args[0];
    }
    return args;
  }

  /**
    * @param {string} str stringa in input
    * @param {length} length lughezza della stringa in output
    * @param {string} [charpad=0] carattere con cui riempire la stringa, se viene passta
                                  una stringa verra considerato solo il primo carattere charpad[0]
    */
  static leftPad(str: string = "", length: number, charpad: string = "0"): string {
    if (length < 1) {
      return str;
    }
    if (charpad.length > 1) {
      charpad = charpad[0];
    }
    var pad = Array(length + 1).join(charpad);
    return pad.substring(0, length - str.length) + str;
  }

  /** 
   * Converte il path in input
   * @param {string} path path da convertire
   */
  static unixPath(path: string) {
    return path.replace(/\\\\/g, "/").replace(/\\/g, "/");
  }

  /**
    * Gestione di default di errori ajax per cui ci e stato un problema
    * nel chiamare le API.
    * 
    * @param {string} message messaggio da loggare nel caso si sia verificato un errore
    *                         per cui non sono state chiamate le API
    * @param {string} error errore restituito dalla chiamata ajax
    * 
    * @return false se l'errore che si e verificato contiene una risposta da parte delle API,
    *         altrimenti torna il messaggio in input alimentato con le informazioni sull'errore
    */
  static ajaxUnreacheableErrorLogHandling(message: string, error: GenericResponse): ErrorMessage {
    var htmlMessage: string = message;
    var stdMessage: string = message;
    if (error.responseText) {
      return null;
    } else {
      var errorMessage = null;
      if (error.status != 0) {
        errorMessage = "Errore (" + error.status + ") " + error.statusText;
      } else {
        errorMessage = "Errore (" + error.status + ") Non e stato possibile raggiungere le API";
      }
      stdMessage += ". " + errorMessage;
      htmlMessage += ".<br><br>" + errorMessage;
      return new ErrorMessageModel(stdMessage, htmlMessage);
    }
  }

  static isAjaxUnreacheableError(error: GenericResponse): boolean {
    if (error.responseText) {
      return false;
    } else {
      return true;
    }
  }

  static fromUnixPathToArray(path: string): Array<string> {
    return path.split("/").filter(pathPart => pathPart);
  }

  static fromArrayToUnixPath(path: Array<string>): string {
    let result: string = "";
    path.forEach((pathPart) => {
      result += pathPart + "/";
    });
    return result;
  }
}