import { File } from 'Models/file.model';
import { FileViewer } from 'Components/file-viewer/file-viewer.component';
import { DbService } from 'Services/db/db.service';
import { FileComplete } from 'Models/file-complete.model';
import { DbHelper } from 'Helpers/db.helper';
import { CacheHelper } from "Helpers/cache.helper";
import { FileViewerWriterJob } from "Jobs/file-writer-job"
import { TailFileJob } from "Jobs/tail-file-job";
import { Logger } from 'Logger/logger';
import { ApiService } from 'Services/api/api.service';

import { Observable, Subscription } from 'rxjs/Rx';
import { FileCompleteJson } from 'Models/file-complete.json';
import { CommonUtils } from 'Util/common-utils';
import { Constants } from 'Util/constants';
import { FileDataReponse } from 'Services/api/response/file-data-response';
import { GenericResponse } from 'Services/api/response/generic-response-json';

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
  private apiService: ApiService;
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
   * Chiamata alle API che scarica tutto il file oppure la chiamata che ottiene l'ultima riga del file per
   * poi richiedere il file completo.
  */
  private fullFileApiCall: Subscription = null;

  private filePath: string = null;

  /**
   * @param {FileViewer} fileViewer istanza del fileViewer su cui verra scritto il testo del file aperto
   */
  constructor(fileViewer: FileViewer, apiService: ApiService, dbService: DbService) {
    if (!dbService) {
      throw new Error("DbService e null");
    }
    if (!apiService) {
      throw new Error("ApiService e null");
    }
    if (!fileViewer) {
      throw new Error("FileViewer e null");
    }
    this.fileViewer = fileViewer;
    this.apiService = apiService;
    this.dbService = dbService;

    this.dbHelper = new DbHelper(dbService);
    this.tailFileJob = new TailFileJob(apiService);
    this.fileWriterJob = new FileViewerWriterJob(fileViewer);
  }

  /**
   * Quando il job recupera del testo da scrivere per il file in sincronizzazione che sta 
   * osservando, il FileViewerHandler deve aggiornare il contenuto del file
   * sul DB e poi deve alimentare il FileWriterJob con la nuova stringa da scrivere
   * sul FileViewer
   */
  private handleUnsincronizedTailedFile(result: File) {
    this.fileWriterJob.writeText(result.readContent);
  }

  /** 
   * Quando il job recupera del testo da scrivere per il file sincronizzato con il BE che sta 
   * osservando, il FileViewerHandler deve aggiornare il contenuto del file
   * sul DB e poi deve alimentare il FileWriterJob con la nuova stringa da scrivere
   * sul FileViewer
   */
  private handleSincronizedTailedFile(result: File) {
    var fileForUpdate = new File(this.filePath, result.readContent, result.rowsRead, result.size, result.encoding);
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
  private clearAndWriteText(file: File) {
    this.fileViewer.clear();
    this.useFileWriterJob(file);
    this.tailFileJob.tail(file);
  }

  private writeText(file: File) {
    this.useFileWriterJob(file);
    this.tailFileJob.tail(file);
  }

  private useFileWriterJob(file: File) {
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
  public openNewFile(filePath: string) {
    if (!filePath) {
      throw new Error("Non e stato inserito il percorso del file da leggere");
    }

    this._openNewFile(filePath, (fileRead: File) => {
      this.clearAndWriteText(fileRead);
      CacheHelper.setLastOpenedFile(fileRead.path);
    });
  }

  public onOpenNewFileError(callback: (message: string) => void = () => { }): FileViewerHandler {
    this._onOpenNewFileError = callback;
    return this;
  }

  public onUnhandledError(callback: (message: string) => void = () => { }): FileViewerHandler {
    this._onUnhandledError = callback;
    return this;
  }

  private _openNewFile(filePathInner: string, onFileRead: (fileRead: File) => void): void {
    let filePath = filePathInner;
    var readFilePromise = new Promise(
      (success, reject) => {
        if (this.fullFileApiCall) {
          //Se era in corso una chiama per ottenere un file completo, la interrompo.
          this.fullFileApiCall.unsubscribe();
        }
        var request = this.dbService.getFile(filePathInner);
        request.onsuccess = (event: any) => {
          if (request.result) {
            //Se il file e gia presente su DB
            this.logger.debug("Il file %s e stato trovato sul DB e verra riaperto", filePathInner);
            var result = request.result;
            var fileRead = new File(result.path, result.readContent, result.rowsRead, result.size, result.encoding);
            this.tailFileJob
              .onFileTailStarted(this._onFileTailStarted)
              .onFileTailed((file: File) => {
                this.handleSincronizedTailedFile(file);
                this._onFileTailed();
              })
              .onFileUnchanged(() => this._onFileTailed);
            success(fileRead);
          } else {
            this.tailFileJob
              .onFileTailStarted(this._onFileTailStarted)
              .onFileTailed((file: File) => {
                this.handleUnsincronizedTailedFile(file);
                this._onFileTailed();
              })
              .onFileUnchanged(() => { this._onFileTailed });
            //Se il file non e stato ancora registrato su DB
            this.logger.debug("Il file %s non e stato trovato sul DB e verra richiesto alle API", filePathInner);
            this.apiService.getFileData(filePathInner).subscribe((result: FileDataReponse) => {
              if (result.isFile) {
                this._onFileTailStarted();
                this.apiService.getTailText(filePathInner, this.NEW_FILE_LINES_TO_READ)
                  .subscribe((result: FileComplete) => {
                    //Tail del file non ancora presente su DB
                    var fileToInsert = new File(filePathInner, result.readContent, result.rowsRead, result.size, result.encoding);
                    this._onFileTailed();
                    this.handleNewFileOpening(fileToInsert);
                    success(fileToInsert);
                  }, (error: GenericResponse) => {
                    if (CommonUtils.isAjaxUnreacheableError(error)) {
                      var message = CommonUtils.ajaxUnreacheableErrorLogHandling(Constants.UNREACHABLE_ERR + " durante la lettura del file " + filePathInner, error);
                      this.logger.warn(message.std);
                    } else {
                      this.logger.warn("Errore durante la chiamata alle API per leggere il file %s: %s", filePathInner, error.responseText);
                    }
                  });
              } else {
                this.logger.warn("%s non e un file e per tanto il FileViewer non verra aggiornato", filePathInner);
              }
            }, (error: GenericResponse) => {
              if (!CommonUtils.isAjaxUnreacheableError(error)) {
                var errorMessage = null;
                try {
                  errorMessage = JSON.parse(error.responseText).error;
                } catch (e) {
                  errorMessage = error.responseText;
                }
                this.logger.warn("Errore durante la chiamata alle API per ottenere i dati del file %s, errore %s: %s",
                  filePathInner, error.status, errorMessage);
                this._onOpenNewFileError("Errore " + error.status + ": " + errorMessage);
              } else {
                var message = CommonUtils.ajaxUnreacheableErrorLogHandling(Constants.UNREACHABLE_ERR, error);
                this.logger.warn(message.std);
                this._onOpenNewFileError(message.html);
              }
            });
          }
        }

        request.onerror = (event: any) => {
          this.logger.warn("Errore durante il reperimento del file %s dal db: %s", filePathInner, event.target.errorCode);
        };
      }
    );

    readFilePromise.then(onFileRead);
  }

  /**
   * Metodo richiamato quando si apre un file che non e stato ancora cachato su db.
   * Deve partire una chiamata che scarica gli ultimi 10MB di file.
   * Dopo aver completato queste operazioni occorre terminare il job che taila il file, poi
   * va lanciata la chiamata alle api manualmente e occorre allineare il file in cache con quello
   * visualizzato.
   * 
   * @param {WlvFile} fileToInsert 
   */
  private handleNewFileOpening(fileToInsert: File) {
    //Ottengo tutto il file
    this._onFullFileDownloadStarted();
    this.fullFileApiCall = this.apiService.getFullFile(fileToInsert.path).subscribe((response: FileComplete) => {
      this._onFullFileDownloaded();
      let fileToSync = new FileComplete(fileToInsert.path, response.readContent, response.rowsRead, response.size, response.encoding, response.rowsInFile);
      var currentJobFileSize;
      //La prima volta che il job avra terminato di effettuare un'elaborazione currentJobFileSize avra il valore
      this.tailFileJob.onFileTailed(() => {
        currentJobFileSize = this.tailFileJob.file.size;
        this.syncronizeFileWithCache(fileToSync, currentJobFileSize);
        this._onFileTailed();
      });
      this.tailFileJob.onFileUnchanged(() => {
        currentJobFileSize = this.tailFileJob.file.size;
        this.syncronizeFileWithCache(fileToSync, currentJobFileSize);
        this._onFileTailed();
      });
    }, (error: GenericResponse) => {
      let errorMsg = "Non e stato possibile inserire in cache il file, errore durante il download: ("
        + error.errorCode + ") " + error.responseText;
      this.logger.error(errorMsg);
      this._onUnhandledError(errorMsg);
    });
  }

  private syncronizeFileWithCache(fileToSync: FileComplete, currentJobFileSize: number) {
    //Siccome devo sencronizzare il file da mettere in cache con quanto si vede in output, fermo il job che taila il file a video
    this._onSyncronizationStarted();
    this.tailFileJob.terminateJob();
    this.tailFileJob.onFileUnchanged(null);
    this.tailFileJob.onFileTailed(null);
    var path = fileToSync.path;
    var manualUnsynchedFileReadRequest: Observable<FileComplete>;
    var manualTosynchFileReadRequest: Observable<FileComplete>;
    this.logger.info("Sincronizzazione con la cache su DB del file %s", path);

    manualUnsynchedFileReadRequest = this.apiService.getTextFromPointer(path, currentJobFileSize, true);
    //Effettuo la chiamata di tail sul file da cachare perche mi servira per la sincronizzazione con quello a video
    manualTosynchFileReadRequest = this.apiService.getTextFromPointer(path, fileToSync.size)

    manualUnsynchedFileReadRequest = Observable.zip(manualUnsynchedFileReadRequest,
      (response: FileComplete) => {
        this.useFileWriterJob(response);
        return response;
      });

    manualTosynchFileReadRequest = Observable.zip(manualTosynchFileReadRequest,
      (response: FileComplete) => {
        return response;
      });

    Observable.zip(manualUnsynchedFileReadRequest, manualTosynchFileReadRequest,
      (manualUnsynchedFileReadResponse, manualTosynchFileReadResponse) => {
        return {
          unsyncFileRensponse: manualUnsynchedFileReadResponse,
          syncFileResponse: manualTosynchFileReadResponse
        };
      }).subscribe((zipped: {
        unsyncFileRensponse: FileComplete;
        syncFileResponse: FileComplete;
      }) => {
        let unsyncFileRensponse = zipped.unsyncFileRensponse;
        let syncFileResponse = zipped.syncFileResponse;
        let fileSync = new FileComplete(syncFileResponse.path,
          fileToSync.readContent.concat(syncFileResponse.readContent),
          fileToSync.rowsRead + syncFileResponse.rowsRead,
          syncFileResponse.size, syncFileResponse.encoding,
          fileToSync.rowsInFile + syncFileResponse.rowsRead);
        //Cacho il file completo
        this.dbHelper.addFile(fileSync.json());
        this.tailFileJob
          .onFileTailed((file) => {
            this.handleSincronizedTailedFile(file);
            this._onFileTailed();
          })
          .onFileUnchanged(() => { this._onFileTailed() });
        let fileGap: File = this.createGapFile(fileSync, syncFileResponse, unsyncFileRensponse);
        //Faccio partire il job per il file cachato, d'ora in poi il file in cache e quello a video sono sincronizzati
        this.writeText(fileGap);
        this.logger.info("Il file %s e stato sincronizzato con la cache su DB", path);
        this._onSyncronizationFinished();
      }, (error: GenericResponse) => {
        let errorMsg = "Non e stato possibile inserire in cache il file che si sta visualizzando: ("
          + error.errorCode + ") " + error.responseText;
        this.logger.error(errorMsg);
        this._onUnhandledError(error.responseText);
      });
  }

  private createGapFile(fileSync: FileComplete, syncFileResponse: FileComplete, unsyncFileRensponse: FileComplete): File {
    //Confronto il file per la sincronizzazione con quello completo per ottenere il file aggiornato con tutto il contenuto
    let minRowsInFile;
    let maxRowsInFile;
    let maxSize;
    let unsyncRowsInFile = this.getFileViewerContentLength();
    if (fileSync.rowsInFile < unsyncRowsInFile) {
      minRowsInFile = fileSync.rowsInFile;
      maxRowsInFile = unsyncRowsInFile;
      maxSize = unsyncFileRensponse.size;
    } else {
      minRowsInFile = fileSync.rowsInFile;
      maxRowsInFile = fileSync.rowsInFile;
      maxSize = fileSync.size;
    }
    //Confronto il file con tutto il contenuto con quello a video per ottenere il contenuto non ancora visulizzato in output
    let fileGap = new File(fileSync.path,
      fileSync.readContent.slice(minRowsInFile, maxRowsInFile),
      maxRowsInFile - minRowsInFile,
      maxSize, fileSync.encoding
    );
    return fileGap;
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