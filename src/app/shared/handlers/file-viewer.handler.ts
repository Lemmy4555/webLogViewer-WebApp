import { FileModel } from 'Models/file.model';
import { FileViewer } from 'Components/file-viewer/file-viewer.component';
import { DbService } from 'Services/db/db.service';
import { FileCompleteModel } from 'Models/file-complete.model';
import { DbHelper } from 'Helpers/db.helper';
import { CacheHelper } from "Helpers/cache.helper";
import { FileViewerWriterJob } from "Jobs/file-writer-job"
import { TailFileJob } from "Jobs/tail-file-job";
import { Logger } from 'Logger/logger';
import { ApiProxyService } from 'Services/api/api-proxy.service';

import { FileCompleteInterface } from 'Models/file-complete.interface';
import { CommonUtils } from 'Utils/common-utils';
import { CommonConstants } from 'Constants/common';
import { FileDataModel } from 'Models/file-data.model';
import { FileDataCompleteModel } from 'Models/file-data-complete.model';
import { GenericResponseInterface } from 'Services/api/response/generic-response.interface';
import { ApiResponseModel } from '../services/api/response/api-response.model';
import { ErrorMessageModel } from 'Utils/common-utils/error-mgmt/error-message.model';

/**
 * Handler che occupa di gestire la scrittura del contenuto di un file nel FileViewer.
 * L'Handler gestisce sia il job TailFileJob che si occupa di effettuare periodicamente una
 * chiamata all'API per controllare che il contenuto del file non sia cambiato; sia il job
 * FileViewerWriteJob che si occupa di scrivere stringhe molto grandi nel FileViewer dividendole
 * in chunk di stringhe piu piccole
 */
export class FileViewerHandler {
  private logger: Logger = new Logger(this.constructor.name);
  private fileViewer: FileViewer;
  private apiProxyService: ApiProxyService;
  private dbHelper: DbHelper;
  private dbService: DbService;

  /** 
   * Istanza del job che si occupa di chiamare le API per ottenere il contenuto del file
   * da visualizzare aggiornato
   */
  private tailFileJob: TailFileJob;
  /** Numero di caratteri da leggere dal fondo di un file non ancora aperto */
  private readonly NEW_FILE_LINES_TO_READ = 20000;
  /** Istanza del job che si occupa di scrivere strighe di grandi dimensioni nel FileViewer */
  private fileWriterJob: FileViewerWriterJob;
  /** Callback richiamata quando si verfica un errore nell'apertura di un file */
  private _onOpenNewFileError: (message: string) => void = (message) => { };
  /** Callback richiamata quando si verifica un errore non gestito */
  private _onUnhandledError: (message: string) => void = (message) => { };
  /** Callback called on sync started */
  private _onSyncronizationStarted: () => void = () => { };
  /** Callback called on sync finished */
  private _onSyncronizationFinished: () => void = () => { };
  /** Callback called on file tail started (on download requested) */
  private _onFileTailStarted: () => void = () => { };
  /** Callback called on fail tailed (file downloaded) */
  private _onFileTailed: () => void = () => { };
  /** Callback called on file tail started (on download requested) */
  private _onFullFileDownloadStarted: () => void = () => { };
  /** Callback called on fail tailed (file downloaded) */
  private _onFullFileDownloaded: () => void = () => { };

  /**
   * @param {FileViewer} fileViewer istanza del fileViewer su cui verra scritto il testo del file aperto
   */
  constructor(fileViewer: FileViewer, apiProxyService: ApiProxyService, dbService: DbService) {
    if (!dbService) {
      throw new Error("DbService e null");
    }
    if (!apiProxyService) {
      throw new Error("ApiService e null");
    }
    if (!fileViewer) {
      throw new Error("FileViewer e null");
    }
    this.fileViewer = fileViewer;
    this.apiProxyService = apiProxyService;
    this.dbService = dbService;

    this.dbHelper = new DbHelper(dbService);
    this.tailFileJob = new TailFileJob(apiProxyService);
    this.fileWriterJob = new FileViewerWriterJob(fileViewer);

    this.fileViewer.onGuessedLine((guessedLine: number) => {
      if(!this.tailFileJob.file || guessedLine > 300) {
        return;
      }

      let file: FileCompleteModel = this.tailFileJob.file;
      
      if(file.rowsInFile - file.rowsRead == 0) {
        return;
      }

      let lineEnd: number = file.rowsInFile - file.rowsRead
      let lineStart: number = lineEnd - 1000;

      if(lineStart < 0) {
        lineStart = 0;
      }

      //TODO: chiamare le api quando si raggiunge l'inizio del fileViewe
      
    });
  }

  /** 
   * Update file on DB and feed the writer job
   */
  private writeFileOutput(result: FileModel) {
    /*
     * When some text is ready to be wrote in output, firstly file on DB must be updated then
     * the writerJob will manage the writing
     */
    var fileForUpdate = new FileModel(result.path, result.readContent, result.rowsRead, result.size, result.encoding, result.currentPointer);
    this.dbHelper.updateFile(fileForUpdate);
    this.fileWriterJob.writeText(result.readContent);
  }

  /**
   * Termina forzatamente il FileWriterJob che scrive sul FileWriter e lo riavvia con
   * il nuovo contenuto del file da scrivere
   * Inoltre riesegue il TailFileJob per il nuovo file da tailare.
   * 
   * @param {WlvFile} file - file da scrivere
   */
  private clearAndWriteText(file: FileCompleteModel) {
    this.fileViewer.clear();
    this.useFileWriterJob(file);
    this._onFileTailed();
    this.tailFileJob.tail(file);
  }

  private useFileWriterJob(file: FileModel) {
    this.fileWriterJob.terminateJob();
    this.fileWriterJob.writeText(file.readContent);
  }

  /**
   * Effettua tutte le operazioni necessarie per leggere un nuovo file e visualizzarlo sul
   * FileViewer.
   * Controlla se sul DB esiste il file che si sta tentando di leggere e se esiste legge il contenuto
   * che si trova sul DB e lo scrive sul FileViewer, poi fa partire il TailFileJob che si occupa di 
   * interrogare le API per ottenere il testo mancante rispetto all'ultima volta che e stato aggiornato
   * il DB.
   * Se il file non viene trovato su DB allora interroga le API per ottenerne il contenuto e aggiunge un
   * nuovo record sul DB con il contenuto letto.
   * Il file rimane in ascolto per aggiornamenti e la scrittura avviene tramite il FileWriterJob per gestire
   * stringhe di grosse dimensioni.
   * 
   * @param {string} filePath - percorso su filesystem del file da leggere
   */
  public openNewFile(filePath: string, from?: number, to?: number) {
    if (!filePath) {
      throw new Error("Non e stato inserito il percorso del file da leggere");
    }

    this._openNewFile(filePath, (fileRead: FileCompleteModel) => {
      this.clearAndWriteText(fileRead);
      CacheHelper.setLastOpenedFile(fileRead.path);
    }, from, to);
  }

  public onOpenNewFileError(callback: (message: string) => void = () => { }): FileViewerHandler {
    this._onOpenNewFileError = callback;
    return this;
  }

  public onUnhandledError(callback: (message: string) => void = () => { }): FileViewerHandler {
    this._onUnhandledError = callback;
    return this;
  }

  private _openNewFile(filePathInner: string, onFileRead: (fileRead: FileModel) => void, from?: number, to?: number): void {
    let filePath = filePathInner;
    var request = this.dbService.getFile(filePathInner);
    request.onsuccess = (event: any) => {
      if (request.result) {
        // File in DB
        this.logger.debug("Il file %s e stato trovato sul DB e verra riaperto", filePathInner);
        var result = request.result;
        var fileRead = new FileModel(result.path, result.readContent, result.rowsRead, result.size, result.encoding, result.currentPointer);
        this.writeFileOutput(fileRead);
        this.tailFileJob
          .onFileTailStarted(() => this._onFileTailStarted())
          .onFileTailed((file: FileModel) => this.callOnFileTailed(file))
          .onFileUnchanged(() => this._onFileTailed());
      } else {
        // File not in DB yet
        this.tailFileJob
          .onFileTailStarted(() => this._onFileTailStarted())
          .onFileTailed((file: FileModel) => {
            // First time a file get tailed must be stored in DB
            this.dbHelper.addFile(file);
            this.callOnFileTailed(file);
            this.tailFileJob.onFileTailed((file: FileModel) => this.callOnFileTailed(file));
          })
          .onFileUnchanged(() => { this._onFileTailed() });
      }

      this.fileViewer.showLoader();
      this._onFileTailStarted();

      let onApiCallEnd: (errorResponse: GenericResponseInterface) => void = (errorResponse: GenericResponseInterface) => {
        let error = CommonUtils.ajaxUnreacheableErrorLogHandling("Errore nell'apertura del file " + filePathInner, errorResponse)
        this.logger.warn(error.std)
        this._onOpenNewFileError(error.html)
      }

      if (from != null && to != null) {
        this.apiProxyService.getTextFromLine(filePathInner, to - from, true, from).subscribe((result: ApiResponseModel<FileCompleteModel>) => {
          this.fileViewer.hideLoader()
          onFileRead(result.response)
        }, onApiCallEnd)
      } else {
        this.apiProxyService.getTailText(filePathInner, 1000, true, null).subscribe((result: ApiResponseModel<FileCompleteModel>) => {
          this.fileViewer.hideLoader()
          onFileRead(result.response)
        }, onApiCallEnd)
      }
    }

    request.onerror = (event: any) => {
      this.logger.warn("Errore durante il reperimento del file %s dal db: %s", filePathInner, event.target.errorCode);
    };
  }

  private callOnFileTailed(file: FileModel): void{
    this.writeFileOutput(file);
    this._onFileTailed();
  }

  private getFileViewerContentLength(): number {
    return this.fileViewer.contentList.length;
  }

  public onSyncronizationStarted(callback: () => void): FileViewerHandler {
    if (!callback) {
      callback = () => { };
    }
    this._onSyncronizationStarted = callback;
    return this;
  }

  public onSyncronizationFinished(callback: () => void): FileViewerHandler {
    if (!callback) {
      callback = () => { };
    }
    this._onSyncronizationFinished = callback;
    return this;
  }

  public onFileTailStarted(callback: () => void): FileViewerHandler {
    if (!callback) {
      callback = () => { };
    }
    this._onFileTailStarted = callback;
    return this;
  }

  public onFileTailed(callback: () => void): FileViewerHandler {
    if (!callback) {
      callback = () => { };
    }
    this._onFileTailed = callback;
    return this;
  }

  public onWriteJobStart(callback: () => void): FileViewerHandler {
    if (!callback) {
      callback = () => { };
    }
    this.fileWriterJob.onWriteJobStart(callback);
    return this;
  }

  public onWriteJobEnd(callback: () => void): FileViewerHandler {
    if (!callback) {
      callback = () => { };
    }
    this.fileWriterJob.onWriteJobEnd(callback);
    return this;
  }

  public onFullFileDownloadStarted(callback: () => void): FileViewerHandler {
    if (!callback) {
      callback = () => { };
    }
    this._onFullFileDownloadStarted = callback;
    return this;
  }

  public onFullFileDownloaded(callback: () => void): FileViewerHandler {
    if (!callback) {
      callback = () => { };
    }
    this._onFullFileDownloaded = callback;
    return this;
  }
}