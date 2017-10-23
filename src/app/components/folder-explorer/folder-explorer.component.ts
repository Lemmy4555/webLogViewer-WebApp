import { Component, ViewChild, ElementRef } from "@angular/core";
import { Logger } from "Logger/logger";
import { MessagesBox } from "Components/messages-box/message-box.component";
import { L45Loader } from "Components/l45-loader/l45-loader.component";
import { FileType } from './file-type';
import { FoldersToView } from './folders-to-view';
import { FolderToViewJSON } from './folders-to-view.json';

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

  /** callback richiamata quando si preme un'elemento della view */
  private _onFolderExplorerElementClick: (fileName: string, isFile: boolean) => void = () => { };
  /** callback richiamata quando si preme il tasto per la cartella superiore */
  private _onFolderExplorerUpClick: () => void = () => { };
  /** callback richiamata quando si preme il tasto per la Home */
  private _onFolderExplorerHomeClick: () => void = () => { };

  /** Indica se il tasto per la cartella superiore e abilitato */
  private isFolderUpEnabled: boolean = false;

  private foldersToView: FoldersToView = null;

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

  private onHomeButtonClick(): void {
    this._onFolderExplorerHomeClick();
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

  private onFolderExplorerElementClickInner(element: FolderToViewJSON): void {
    this.logger.debug("Premuto l'elemento %s del folder-explorer", element.name);
    this._onFolderExplorerElementClick(element.name, this.isFile(element.type));
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

    public onFolderExplorerElementClick(
      callback: (fileName: string, isFile: boolean) => void): FolderExplorer {
      this._onFolderExplorerElementClick = callback;
      return this;
    }

    public onFolderExplorerUpClick(callback: () => void): FolderExplorer {
      this._onFolderExplorerUpClick = callback;
      return this;
    }

    public onFolderExplorerHomeClick(callback: () => void): FolderExplorer {
      this._onFolderExplorerHomeClick = callback;
      return this;
    }

}
