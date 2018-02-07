import { Component, ViewChild, ElementRef, Output, EventEmitter } from '@angular/core';
import { Logger } from "Logger/logger";
import { MessagesBox } from "Components/messages-box/message-box.component";
import { L45Loader } from "Components/l45-loader/l45-loader.component";
import { FileType } from './file-type';
import { FoldersToView } from './folders-to-view';
import { FolderToViewJSON } from './folders-to-view.json';
import { FileHistoryService } from 'Services/file-history/file-history.service';
import { ApiProxyService } from 'Services/api/api-proxy.service';
import { CommonUtils } from 'Utils/common-utils';
import { DefaultDirInterface } from 'Models/default-dir.interface';
import { GenericResponseInterface } from 'Services/api/response/generic-response.interface';
import { ErrorMessageInterface } from 'Utils/common-utils/error-mgmt/error-message.interface';
import { FileDataModel } from 'Models/file-data.model';
import { CacheHelper } from 'Helpers/cache.helper';
import { FileModel } from 'Models/file.model';
import { FileHistoryModel } from 'Models/file-history.model';
import { ArrayUtils } from 'Utils/array-utils';

/**
 * Explorer used to navigate in folders of the server's file-system.
 */
@Component({
  selector: "folder-explorer",
  templateUrl: "./folder-explorer.component.html",
  styleUrls: ["./folder-explorer.component.css"]
})
export class FolderExplorer {
  logger: Logger = new Logger(this.constructor.name);

  /** Indica se il tasto per la cartella superiore e abilitato */
  private isFolderUpEnabled: boolean = false;

  private foldersToView: FoldersToView = null;

  private fileHistoryService: FileHistoryService;

  /** Visualizza messaggi di errore nel componente */
  @ViewChild(MessagesBox)
  private messagesBox: MessagesBox;
  /** Loader caricamento */
  @ViewChild(L45Loader)
  private l45Loader: L45Loader;
  /** rappresenta la lista di elementi del folder corrente */
  @ViewChild("folderExplorerList")
  private ulFolderExplorerViewer: ElementRef;
  /** Tasto per andare alla cartella superiore */
  @ViewChild("folderUp")
  private folderUpButton: ElementRef;
  /** Tasto per andare alla cartella superiore */
  @ViewChild("goHome")
  private homeButton: ElementRef;

  /**
   * Cartella di default del Computer in cui si trova il server con le API, e la cartella di partenza del FolderExplorer
   * se e la prima volta che viene utilizzata la webapp
   */
  private DEFAULT_FOLDER: string = "";
  /** Cartella attualmente aperta, serve per poter navigare nel subfolders o per risalire alla cartella superiore */
  private currentFolder: string = "";

  private apiProxyService: ApiProxyService = null;

  @Output("onOpenFile") 
  private onOpenFile: EventEmitter<string> = new EventEmitter();
  @Output("onOpenFolder") 
  private onOpenFolder: EventEmitter<string[]> = new EventEmitter();

  constructor(fileHistoryService: FileHistoryService, apiProxyService: ApiProxyService) {
    this.fileHistoryService = fileHistoryService;
    this.apiProxyService = apiProxyService;
  }

  private getAndGoToHomeDir(): void {
    if (this.DEFAULT_FOLDER === "") {
      this.showLoader();
      this.apiProxyService.getHomeDir().subscribe(
        (result: DefaultDirInterface) => {
          this.DEFAULT_FOLDER = CommonUtils.unixPath(result.path);
          this.logger.info("La default dir e stata settata a: %s", this.DEFAULT_FOLDER);
          this.navigateToHomeDir();
          this.hideLoader();
        }, (error: GenericResponseInterface) => {
          var message: string = null;
          if (CommonUtils.isAjaxUnreacheableError(error)) {
            var handledMessage = CommonUtils.ajaxUnreacheableErrorLogHandling(
              "Errore durante il recupero della home dir", error
            );
            message = handledMessage.html;
            this.logger.warn(handledMessage.std);
          } else {
            message = "Errore durante il recupero della home dir: " + error.responseText;
            this.logger.warn(message);
          }
          this.hideLoader();
          this.showMessage(message);
        });
    } else {
      this.navigateToHomeDir();
    }
  }

  private emptyFolderElementList(): void {
    this.foldersToView = null;
  }

  public showLoader(): void {
    this.emptyFolderElementList();
    this.messagesBox.closeMessage();
    this.l45Loader.showLoader();
    this.isFolderUpEnabled = false;
  }

  public hideLoader(): void {
    this.l45Loader.hideLoader();
    this.isFolderUpEnabled = false;
  }

  public showMessage(message: string): void {
    this.emptyFolderElementList();
    this.l45Loader.hideLoader();
    this.messagesBox.showMessage(message);
    this.disableFolderUp();
  }

  public closeMessage(): void {
    this.messagesBox.closeMessage();
    this.enableFolderUp();
  }

  public disableFolderUp(): void {
    this.isFolderUpEnabled = false;
  }

  public enableFolderUp(): void {
    this.isFolderUpEnabled = true;
  }

  /**
   * Aggiorna la view con gli elementi da visualizzare in input. 
   * struttura di input:
   * {toView: [{type: 'folder', name: 'test'},{type: 'file', name: 'test2'}]}
   * 
   * @param {FolderExplorerView} foldersToView struttura di cartelle da visualizzare, toView rappresenta gli elementi
   *                                           nella folder corrente da visualizzare mentre up rappresenta la cartella superiore
   */
  public updateView(foldersToView: FoldersToView): void {
    foldersToView.elements = foldersToView.elements.sort(this.orderFoldersViewByName);
    this.foldersToView = foldersToView;
    this.logger.debug("La view del folder-explorer e stata aggiornata");
  }

  private orderFoldersViewByName(a: FolderToViewJSON, b: FolderToViewJSON): number {
    return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
  }

  /**
   * @return {boolean} true if "file"; false if "file"
   */
  private isFile(type: FileType) {
    return type === FileType.FILE ? true : false;
  }

  public onFolderExplorerElementClick(name: string, isFile: boolean): void {
    this.logger.debug("Premuto l'elemento %s del folder-explorer", name);
    //Se si preme su un elemento, il nome della cartella o del file viene concatenato al path corrente
    var path = CommonUtils.unixPath(this.currentFolder) + "/" + name;
    if (!isFile) {
      this.openFolder(path);
    } else {
      this.openFile(path, name);
    }
  }

  public onFolderExplorerUpClick(): void {
    if(!this.isFolderUpEnabled) {
      return;
    }
    this.openFolder(this.currentFolder.substr(0, this.currentFolder.lastIndexOf("/")));
  }

  /** 
   * Metodo che dato un percorso in input lo converte in un path di tipo UNIX e lo salva nella currentFolder
   * @param {string} path path da impostare
   */
  private setCurrentFolder(path: string) {
    this.currentFolder = CommonUtils.unixPath(path);
  }

  public navigateToHomeDir() {
    this.logger.debug("Navigazione alla default dir");
    this.closeMessage();
    if(this.DEFAULT_FOLDER === "") {
      this.getAndGoToHomeDir();
    } else {
      this.navigateTo(this.DEFAULT_FOLDER);
    }
    this.hideLoader();
  }

  /**
   * Aggiorna la view del FolderExplorer e chiama la callback quando la view e stata aggiornata.
   */
  private updateFolderExplorer(path: string, fileList: FoldersToView) {
    this.setCurrentFolder(path);
    this.updateView(fileList);
    this.onOpenFolder.emit(CommonUtils.fromUnixPathToArray(this.currentFolder));
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
    this.showLoader();
    path = CommonUtils.unixPath(path);
    this.apiProxyService.getFileData(path)
      .subscribe((result: FileDataModel) => {
        this.showLoader();
        if (!result.isFile) {
          this.openFolder(path);
        } else {
          this.openFile(path);
        }
      }, (error: GenericResponseInterface) => {
        if (CommonUtils.isAjaxUnreacheableError(error)) {
          let message: ErrorMessageInterface =
            CommonUtils.ajaxUnreacheableErrorLogHandling(
              "Errore durante la navigazione a " + path, error
            );
          this.logger.warn(message.std);
          this.showMessage(message.html);
        } else {
          let message: string;
          message = "Errore durante la navigazione a " + path + ": " + error.responseText;
          this.logger.warn(message);
          this.showMessage(message);
        }
      });
  }

  private openFolder(path: string): void {
    this.logger.debug("Apertura cartella %s", path);
    this.showLoader();
    this.apiProxyService.getFileList(path)
      .subscribe((result) => {
        let foldersToView: FoldersToView =
          FoldersToView.buildFromFileListDataResponse(result);
        this.updateFolderExplorer(path, foldersToView);
        this.hideLoader();
        if (this.currentFolder.lastIndexOf("/") < 0) {
          this.disableFolderUp();
        } else {
          this.enableFolderUp();
        }
        CacheHelper.setLastOpenedFolder(path);
      }, error => {
        if (CommonUtils.isAjaxUnreacheableError(error)) {
          let message: ErrorMessageInterface = CommonUtils.ajaxUnreacheableErrorLogHandling(
            "Errore durante l'apertura della cartella " + path, error);
          this.logger.warn(message.std);
        } else {
          let message: string = "Errore durante l'apertura della cartella " + path + ": " + error.responseText;
          this.logger.warn(message);
          this.showMessage(message);
        }
      });
  }

  private openFile(path: string, fileName?: string) {
    this.logger.debug("Apertura file %s", path);
    if(!fileName) {
      fileName = ArrayUtils.getLast(path.split("/"));
    }
    let file = new FileHistoryModel(path, fileName);
    this.fileHistoryService.addFileToHistory(file);
    this.onOpenFile.emit(path);
  }

}
