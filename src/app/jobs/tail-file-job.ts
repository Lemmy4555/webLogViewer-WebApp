import { File } from "Models/file.model";
import { ApiService } from 'Services/api/api.service';
import { Logger } from 'Logger/logger';
import { Observable, Subscription } from 'rxjs/Rx';
import { FileCompleteJson } from 'Models/file-complete.json';
import { CommonUtils } from 'Util/common-utils';
import { Constants } from 'Util/constants';
import { GenericResponse } from 'Services/api/response/generic-response-json';

/**
 * Job che dato un file rimane in lettura e se il file viene modificato torna le nuove righe aggiunte.
 */
export class TailFileJob {
  private logger: Logger = new Logger(this.constructor.name);
  /** tempo di attesa dopo ogni request */
  private readonly UPDATE_INTERVAL = 10000;
  /** get request eseguita per ottenere il testo dal file */
  private getRequest: Subscription = null;
  /** setInterval che si occupa di fare la chiamata get */
  private job: number = null;
  /** il file che si sta leggendo attualmente */
  private _file: File = null;

  /** 
   * callback richiamata quando viene eseguita una request
   * @param {WlvFile} updatedFile file aggiornato con le ultime righe inserite
   */
  private _onFileTailed: (file: File) => void = (updatedFile: File) => { };
  private _onFileUnchanged: () => void = () => { };
  private _onTailStarted: () => void = () => { };

  private apiService: ApiService;

  constructor(apiService: ApiService) {
    if (!apiService) {
      throw new Error("apiService e null");
    }
    this.apiService = apiService;
  }

  /**
   * Avvia un nuovo job che rimane in lettura del file in input, quando il file in input
   * viene modificato, il nuovo contenuto del file viene tornato tramite la callback onFileTailed.
   * Se c'e gia un job in esecuzione, questo viene terminato e l'eventuale request alle API in corso viene
   * annullata
   */
  public tail(toTail: File): TailFileJob {
    this.terminateJob();
    this.startNewJob(toTail);
    return this;
  }

  public onFileTailStarted(callback: () => void): TailFileJob {
    if(!callback) {
      callback = () => {};
    }

    this._onTailStarted = callback;
    return this
  }

  public onFileTailed(callback: (file: File) => void): TailFileJob {
    if(!callback) {
      callback = () => {};
    }
    this._onFileTailed = callback;
    return this;
  }

  public onFileUnchanged(callback: () => void): TailFileJob {
    if(!callback) {
      callback = () => {};
    }
    this._onFileUnchanged = callback;
    return this;
  }

  /**
   * Avvia un nuovo job che rimane in lettura del file in input
   */
  private startNewJob(fileInner: File): void {
    this.logger.debug("E stato richiesto un nuovo job per il tail del file " + fileInner.path);
    this._file = fileInner;
    this.job = window.setInterval(() => {
      this.jobImpl();
    }, this.UPDATE_INTERVAL);
  }

  public jobImpl(): void {
    this.logger.debug("Il file tailed ora ha " + this.file.readContent.length + " righe");
    if (this.getRequest) {
      this.logger.warn("E gia stata effettuata una richiesta alle API per il tail, si attendera che finisca");
      return;
    }
    this._onTailStarted();
    this.getRequest = this.apiService.getTextFromPointer(this.file.path, this.file.size)
      .subscribe((result: FileCompleteJson) => {
        this.logger.debug("La chiamata alle API per il tail e avvenuta con successo per il file " + this.file.path);
        let resultFile: File = File.buildFromJson(result);
        if (this.file.size >= resultFile.size) {
          this.logger.debug("Il file da tailare non e cambiato");
          this._onFileUnchanged();
          return;
        }
        this.file = new File(
          this.file.path,
          this.file.readContent.concat(resultFile.readContent),
          this.file.rowsRead += resultFile.rowsRead,
          resultFile.size,
          resultFile.encoding);
        this._onFileTailed(resultFile);
      }, (error: GenericResponse) => {
        if (CommonUtils.isAjaxUnreacheableError(error)) {
          var message = CommonUtils.ajaxUnreacheableErrorLogHandling(Constants.UNREACHABLE_ERR + " durante il tail del file " + this.file.path, error);
          this.logger.warn(message.std);
        } else {
          this.logger.warn("Errore nel tail del file %s: %s", this.file.path, error.responseText);
        }
      }, () => {
        this.getRequest = null;
      });
  }

  public setFile(fileToSet: File) {
    if (this.getRequest || this.job) {
      /*
      * Il tail ferma il job azzerando le variabili getRequest e job,
      * poi setta il file e avvia il nuovo job.
      * In questo modo al set del file, il job si riavvia col nuovo file in input.
      */
      this.tail(fileToSet);
    } else {
      this._file = fileToSet;
    }
  }

  public getFile() {
    return this._file;
  }

  /**
   * Termina il job se e in esecuzione e cancella l'eventuale request in corso.
   */
  public terminateJob() {
    if (this.getRequest) {
      this.getRequest.unsubscribe();
      this.getRequest = null;
    }
    if (this.job) {
      clearInterval(this.job);
    }
    this.job = null;
    this.file = null;
  }

  get file(): File {
    return this.getFile();
  }

  set file(file: File) {
    this.setFile(file);
  }
}