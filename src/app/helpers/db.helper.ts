import { Logger } from 'Logger/logger';
import { DbService } from 'Services/db/db.service';
import { File } from 'Models/file.model';
import { FileJson } from 'Models/file.json';
import { FileCompleteJson } from 'Models/file-complete.json';
import { FileComplete } from 'Models/file-complete.model';

/**
 * Classe che si occupa di effettuare le chiamate al Db utilizzando il DbManager.
 * Eventuali controlli e operazioni aggiuntive sull'inserimento, sulla modifica o sulla lettura dei dati sono implementati
 * in questa classe statica
 * Per i metodi di update e inserimento, se la property readContent che rappresenta il contenuto di un file,
 * supera la dimensione massima di MAX_CONTENT_SIZE, il valore della property viene tagliato fino a raggiungere
 * la dimensione massima.
 * @static
 */
export class DbHelper {
  private logger: Logger = new Logger(this.constructor.name);
  private dbService: DbService;

  constructor(dbService: DbService) {
    this.dbService = dbService;
  }


  /** 
   * Aggiorna il file in input sul DB con il nuovo valore di readContent, rowsRead e size
   * @param {WlvFile} file file con i dati aggiornati
   */
  public updateFile(file: FileCompleteJson) {
    var request = this.dbService.getFile(file.path);
    request.onsuccess = (event: FileJson) => {
      var result = request.result;
      if(!result) {
        this.logger.warn("Non e stato trovato nessun file salvato con il path: %s", file.path);
        return;
      }
      var fileRead = FileComplete.buildFromJson(result);
      fileRead.readContent = fileRead.readContent.concat(file.readContent);
      fileRead.rowsRead = fileRead.rowsRead + file.rowsRead;
      fileRead.size = file.size;
      var updateReq =  this.dbService.putFile(fileRead);
      updateReq.onsuccess = (event: any) => {
        this.logger.debug("Aggiornato content sul db per il file: %s", fileRead.path);
      }
      updateReq.onerror = (event: any) => {
        this.logger.warn("Errore nell'update del file: %s", fileRead.path);
      }
    };
    request.onerror = (event: any) => {
      this.logger.warn("Errore nella lettura del file: %s", file.path);
    };
  }

  /** 
   * Inserisce il file in input sul DB
   * @param {WlvFile} file file con i dati da inserire
   */
  public addFile(file: FileCompleteJson) {
    file.readContent = file.readContent;
    var request = this.dbService.addFile(file);
    request.onsuccess = (event: any) => {
      this.logger.debug('Inserito content su db per il file: ' + file.path);
    };
    request.onerror = (event: any) => {
      this.logger.warn("Errore nell'insert del file: " + file.path);
    };
  }
}