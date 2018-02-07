import { FileModel } from "Models/file.model";
import { ApiProxyService } from 'Services/api/api-proxy.service';
import { Logger } from 'Logger/logger';
import { Subscription } from 'rxjs/Rx';
import { FileCompleteInterface } from 'Models/file-complete.interface';
import { CommonUtils } from 'Utils/common-utils';
import { CommonConstants } from 'Constants/common';
import { GenericResponseInterface } from 'Services/api/response/generic-response.interface';
import { ApiResponseModel } from 'Services/api/response/api-response.model';
import { FileCompleteModel } from 'Models/file-complete.model';

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
  private _file: FileCompleteModel = null;

  /** 
   * callback richiamata quando viene eseguita una request
   * @param {WlvFile} updatedFile file aggiornato con le ultime righe inserite
   */
  private _onFileTailed: (file: FileModel) => void = (updatedFile: FileModel) => { };
  private _onFileUnchanged: () => void = () => { };
  private _onTailStarted: () => void = () => { };

  private apiProxyService: ApiProxyService;

  constructor(apiProxyService: ApiProxyService) {
    if (!apiProxyService) {
      throw new Error("apiProxyService is null");
    }
    this.apiProxyService = apiProxyService;
  }

  /**
   * Start a new job listening for file updates.
   * Both the file has been read and it has been updated the read content will be returned by onFileTailed callback.
   * If a the job was already running it will be terminated and any pending API request will be canceled.
   */
  public tail(toTail: FileCompleteModel): TailFileJob {
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

  public onFileTailed(callback: (file: FileModel) => void): TailFileJob {
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
   * Start a new job listening for file updates
   */
  private startNewJob(fileInner: FileCompleteModel): void {
    this.logger.debug("A new job has been requested for file: %s", fileInner.path);
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
    this.getRequest = this.apiProxyService.getTextFromPointer(this.file.path, null, null, this.file.size)
      .subscribe((result: ApiResponseModel<FileCompleteModel>) => {
        this.logger.debug("La chiamata alle API per il tail e avvenuta con successo per il file " + this.file.path);
        let resultFile: FileModel = FileModel.buildFromJson(result.response);
        if (this.file.size >= resultFile.size) {
          this.logger.debug("Il file da tailare non e cambiato");
          this._onFileUnchanged();
          return;
        }
        this.file = new FileCompleteModel(
          this.file.path,
          this.file.readContent.concat(resultFile.readContent),
          this.file.rowsRead += resultFile.rowsRead,
          resultFile.size,
          resultFile.encoding,
          resultFile.currentPointer);
        this._onFileTailed(resultFile);
      }, (error: GenericResponseInterface) => {
        if (CommonUtils.isAjaxUnreacheableError(error)) {
          var message = CommonUtils.ajaxUnreacheableErrorLogHandling("Errore durante il tail del file " + this.file.path, error);
          this.logger.warn(message.std);
        } else {
          this.logger.warn("Errore nel tail del file %s: %s", this.file.path, error.responseText);
        }
      }, () => {
        this.getRequest = null;
      });
  }

  public setFile(fileToSet: FileCompleteModel) {
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

  public getFile(): FileCompleteModel {
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

  get file(): FileCompleteModel {
    return this.getFile();
  }

  set file(file: FileCompleteModel) {
    this.setFile(file);
  }
}