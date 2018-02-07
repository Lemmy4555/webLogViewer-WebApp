import { ErrorMessageInterface } from './error-mgmt/error-message.interface';
import { ErrorMessageModel } from './error-mgmt/error-message.model';
import { GenericResponseInterface } from 'Services/api/response/generic-response.interface';

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
   * If the input string is shorter than the specified length there will be added chardpads (default is '0')
   * at the begininng of the screen to reach the input length. \r\n <br>
   * es:
   * leftPad("123", 6) will return 000123.
   * leftPad("123", 6, "9") will return 999123.
   * leftPad("123", 6, "90123") will return 999123, only first char can be considered charpad.
   * leftPad("123", 2) will return 123.
   * @param {string} str input string
   * @param {length} length min length of output string
   * @param {string} [charpad=0] character used to fill the input string in case a string is passed only the 
   *                             first character will be considered charpad[0]
   */
  static leftPad(str: string = "", length: number, charpad: string = "0"): string {
    if(str.length >= length) {
      return str;
    }
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
  static ajaxUnreacheableErrorLogHandling(message: string, error: GenericResponseInterface): ErrorMessageInterface {
    var htmlMessage: string = message;
    var stdMessage: string = message;
    if (error.responseText) {
      return null;
    } else {
      var errorMessage: string = null;
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

  static isAjaxUnreacheableError(error: GenericResponseInterface): boolean {
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
    path.forEach((pathPart, index) => {
      result += pathPart;
      if(index < path.length - 1) {
        result += "/"
      }
    });
    return result;
  }
}