import { Inject, ReflectiveInjector, Injector } from '@angular/core';

import { FolderExplorer } from 'Components/folder-explorer/folder-explorer.component';
import { Logger } from 'Logger/logger';
import { CommonUtils } from 'Util/common-utils';
import { ApiService } from 'Services/api/api.service';
import { DefaultDirResponse } from 'Services/api/response/default-dir-response';
import { Constants } from 'Util/constants';
import { FoldersToView } from 'Components/folder-explorer/folders-to-view';
import { FileDataReponse } from 'Services/api/response/file-data-response';
import { ErrorMessage } from 'Util/error-mgmt/error-message';
import { ErrorMessageModel } from 'Util/error-mgmt/error-message.model';
import { GenericResponse } from 'Services/api/response/generic-response-json';
import { CacheHelper } from 'Helpers/cache.helper';

/**
 * Handler che si occupa di gestire il FolderExplorer: tiene traccia della cartella di default, della cartella
 * che si sta visualizzando correntemente e richiama FolderExplorer per aggiornarne la view in HTML.
 * Si occupa anche di effettuare le chiamate alle API necessarie per la gestione di FolderExplorer.
 */
export class FolderExplorerHandler {

  private logger: Logger = new Logger(this.constructor.name);

  /**
   * Cartella di default del Computer in cui si trova il server con le API, e la cartella di partenza del FolderExplorer
   * se e la prima volta che viene utilizzata la webapp
   */
  private DEFAULT_FOLDER: string = "";
  /** Cartella attualmente aperta, serve per poter navigare nel subfolders o per risalire alla cartella superiore */
  private currentFolder: string = "";
  /** callback richiamata nel momento in cui viene aperto un file e non una cartella */
  private _onOpenFile: (path: string) => void = (path: string) => { };
  /** callback richiamata nel momento in cui viene aperto una cartella */
  private _onOpenFolder: (path: Array<string>) => void = (path: Array<string>) => { };
  /** Callback richiamata quando si veriffica un errore nella chiamata alle API */
  private _onApiCallError: (message: string) => void = (message: string) => { };

  private folderExplorer: FolderExplorer = null;
  private apiService: ApiService = null;

  
  /**
   * @param {FolderExplorer} folderExplorer istanza del folderExplorer che verra alimentata con i dati aggiornati dall'Handler
   */
  constructor(folderExplorer: FolderExplorer, apiService: ApiService) {
    if (!folderExplorer) {
      throw new Error("Il FolderExplorer in input e null");
    }
    if (!apiService) {
      throw new Error("L'ApiService in input e null");
    }
    this.folderExplorer = folderExplorer;
    this.apiService = apiService;

    /*
    * Quando viene premuto un elemento del FolderExplorer, il FolderExplorerHandler effettua le operazioni
    * necessarie per aprire un file o una cartella.
    */
    folderExplorer.onFolderExplorerElementClick((fileName, isFile) => {
      this.onFolderExplorerElementClick(fileName, isFile);
    });


    /*
     * Quando viene premuto il tasto della cartella superiore del FolderExplorer il FolderExplorerHandler
     * elimina dal path l'ultimo elemento concatenato ed effettua la navigazione nella cartella
     */
    folderExplorer.onFolderExplorerUpClick(() => {
      this.openFolder(this.currentFolder.substr(0, this.currentFolder.lastIndexOf("/")));
    });

    /*
     * Quando viene premuto il tasto della Home
     */
    folderExplorer.onFolderExplorerHomeClick(() => {
      this.getAndGoToHomeDir();
    });
  }

  private onFolderExplorerElementClick(fileName: string, isFile: boolean) {
    //Se si preme su un elemento, il nome della cartella o del file viene concatenato al path corrente
    var path = CommonUtils.unixPath(this.currentFolder) + "/" + fileName;
    if (!isFile) {
      this.openFolder(path);
    } else {
      this.openFile(path);
    }
  }

  /** 
     * Metodo che dato un percorso in input lo converte in un path di tipo UNIX e lo salva nella currentFolder
     * @param {string} path path da impostare
     */
  private setCurrentFolder(path: string) {
    this.currentFolder = CommonUtils.unixPath(path);
  }

  private getAndGoToHomeDir() {
    if (this.DEFAULT_FOLDER === "") {
      this.folderExplorer.showLoader();
      this.apiService.getHomeDir().subscribe(
        (result: DefaultDirResponse) => {
          this.DEFAULT_FOLDER = CommonUtils.unixPath(result.path);
          this.logger.info("La default dir e stata settata a: %s", this.DEFAULT_FOLDER);
          this.navigateToHomeDir();
          this.folderExplorer.hideLoader();
        }, (error: GenericResponse) => {
          var message: string = null;
          if (CommonUtils.isAjaxUnreacheableError(error)) {
            var handledMessage = CommonUtils.ajaxUnreacheableErrorLogHandling(
              Constants.UNREACHABLE_ERR + " durante il recupero della home dir", error
            );
            message = handledMessage.html;
            this.logger.warn(handledMessage.std);
          } else {
            message = "Errore durante il recupero della home dir: " + error.responseText;
            this.logger.warn(message);
          }
          this.folderExplorer.hideLoader();
          this._onApiCallError(message);
        });
    } else {
      this.navigateToHomeDir();
    }
  }


  public onApiCallError(callback: (message: string) => void) {
    this._onApiCallError = callback;
    return this;
  }

  public navigateToHomeDir() {
    this.logger.debug("Navigazione alla default dir");
    this.folderExplorer.closeMessage();
    if(this.DEFAULT_FOLDER === "") {
      this.getAndGoToHomeDir();
    } else {
      this.navigateTo(this.DEFAULT_FOLDER);
    }
    this.folderExplorer.hideLoader();
  }

  /**
   * Aggiorna la view del FolderExplorer e chiama la callback quando la view e stata aggiornata.
   */
  private updateFolderExplorer(path: string, fileList: FoldersToView) {
    this.setCurrentFolder(path);
    this.folderExplorer.updateView(fileList);
    this._onOpenFolder(CommonUtils.fromUnixPathToArray(this.currentFolder));
  }

  /**
   * Naviga al path specificato:
   * Chiama le API per ottenere le informazioni dell'elemento in cui si vuole navigare,
   * se l'elemento e una cartella viene aggiornata la view del FolderExplorer invece se
   * l'elemento e un file si aggiorna la view del FolderExplorer con il parent folder del file
   * e viene aggiornata la view del FileViewer con il contenuto del file.
   * @param {string} path path in cui si vuole navigare, prima di ogni cosa il path 
   *                      viene sempre convertito in formato UNIX
   */
  public navigateTo(path: string): void {
    this.folderExplorer.showLoader();
    path = CommonUtils.unixPath(path);
    this.apiService.getFileData(path)
      .subscribe((result: FileDataReponse) => {
        this.folderExplorer.showLoader();
        if (!result.isFile) {
          this.openFolder(path);
        } else {
          this.openFile(path);
        }
      }, (error: GenericResponse) => {
        if (CommonUtils.isAjaxUnreacheableError(error)) {
          let message: ErrorMessage =
            CommonUtils.ajaxUnreacheableErrorLogHandling(
              Constants.UNREACHABLE_ERR + " durante la navigazione a " + path, error
            );
          this.logger.warn(message.std);
          this._onApiCallError(message.html);
        } else {
          let message: string;
          message = "Errore durante la navigazione a " + path + ": " + error.responseText;
          this.logger.warn(message);
          this._onApiCallError(message);
        }
      });
  }

  /**
   * Imposta la callback chiamata quando si apre un elemento di tipo File
   */
  public onOpenFile = function (callback: (path: string) => void): FolderExplorerHandler {
    this._onOpenFile = callback;
    return this;
  }

  /**
   * Imposta la callback chiamata quando si apre un elemento di tipo File
   */
  public onOpenFolder = function (callback: (path: Array<string>) => void): FolderExplorerHandler {
    this._onOpenFolder = callback;
    return this;
  }

  private openFolder(path: string): void {
    this.logger.debug("Apertura cartella %s", path);
    this.folderExplorer.showLoader();
    this.apiService.getFileList(path)
      .subscribe((result) => {
        let foldersToView: FoldersToView =
          FoldersToView.buildFromFileListDataResponse(result);
        this.updateFolderExplorer(path, foldersToView);
        this.folderExplorer.hideLoader();
        if (this.currentFolder.lastIndexOf("/") < 0) {
          this.folderExplorer.disableFolderUp();
        } else {
          this.folderExplorer.enableFolderUp();
        }
        CacheHelper.setLastOpenedFolder(path);
      }, error => {
        if (CommonUtils.isAjaxUnreacheableError(error)) {
          let message: ErrorMessage = CommonUtils.ajaxUnreacheableErrorLogHandling(
            Constants.UNREACHABLE_ERR + " durante l'apertura della cartella " + path, error);
          this.logger.warn(message.std);
        } else {
          let message: string = "Errore durante l'apertura della cartella " + path + ": " + error.responseText;
          this.logger.warn(message);
          this.folderExplorer.showMessage(message);
        }
      });
  }

  private openFile(path: string) {
    this.logger.debug("Apertura file %s", path);
    this._onOpenFile(path);
  }


}