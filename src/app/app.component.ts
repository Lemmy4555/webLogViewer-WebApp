import { Component, ViewChild, OnInit } from '@angular/core';

import { FolderExplorer } from 'Components/folder-explorer/folder-explorer.component';
import { FolderExplorerHandler } from 'Handlers/folder-explorer.handler';
import { FilePathInputText } from 'Components/file-path-input-text/file-path-input-text.component';
import { PopUpErrorLog } from 'Components/pop-up-error-log/pop-up-error.component';
import { ApiService } from 'Services/api/api.service';
import { FileViewerHandler } from 'Handlers/file-viewer.handler';
import { DbService } from 'Services/db/db.service';
import { FileViewer } from 'Components/file-viewer/file-viewer.component';
import { CacheHelper } from 'Helpers/cache.helper';
import { Logger } from 'Logger/logger';
import { FilePathViewer } from 'Components/file-path-viewer/file-path-viewer.component';
import { BackgroundNotifications } from 'Components/background-notifications/background-notifications.component';

@Component({
  selector: "web-log-viewer",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.css"]
})
export class AppComponent implements OnInit {
  private logger: Logger = new Logger(this.constructor.name);

  @ViewChild(FolderExplorer)
  private folderExplorer: FolderExplorer;
  @ViewChild(FilePathInputText)
  private filePathInputText: FilePathInputText;
  @ViewChild(PopUpErrorLog)
  private popUpErrorLog: PopUpErrorLog;
  @ViewChild(FileViewer)
  private fileViewer: FileViewer;
  @ViewChild(FilePathViewer)
  private filePathViewer: FilePathViewer;
  @ViewChild(BackgroundNotifications)
  private backgroundNotifications: BackgroundNotifications;

  private apiService: ApiService;
  private dbService: DbService;

  private folderExplorerHandler: FolderExplorerHandler;
  private fileViewerHandler: FileViewerHandler;

  constructor(apiService: ApiService, dbService: DbService) {
    this.apiService = apiService;
    this.dbService = dbService;
  }

  public ngOnInit() {
    this.logger.debug("Initializing app");
    this.folderExplorerHandler = new FolderExplorerHandler(this.folderExplorer, this.apiService);
    this.fileViewerHandler = new FileViewerHandler(this.fileViewer, this.apiService, this.dbService);

    this.fileViewerHandler
      .onOpenNewFileError((message: string) => { this.fileViewer.showMessage(message); })
      .onUnhandledError((message: string) => { this.popUpErrorLog.showLog(message); })
      .onSyncronizationStarted(() => { this.backgroundNotifications.showSyncNotification(); })
      .onSyncronizationFinished(() => { this.backgroundNotifications.hideSyncNotification(); })
      .onFileTailStarted(() => { this.backgroundNotifications.showDownloadNotification(); })
      .onFileTailed(() => { this.backgroundNotifications.hideDownloadNotification(); })
      .onWriteJobStart(() => { this.backgroundNotifications.showWriteNotification(); })
      .onWriteJobEnd(() => { this.backgroundNotifications.showOkNotification(); })
      .onFullFileDownloadStarted(() => { this.backgroundNotifications.showFileNotification(); })
      .onFullFileDownloaded(() => { this.backgroundNotifications.hideFileNotification(); });

    this.folderExplorerHandler
      .onApiCallError((message) => {
        this.folderExplorer.showMessage(message);
      })
      .onOpenFile((fileName: string) => this.fileViewerHandler.openNewFile(fileName))
      .onOpenFolder((path: Array<string>) => { this.filePathViewer.path = path });

    this.filePathInputText.onPathInsert((path: string) => this.folderExplorerHandler.navigateTo(path));
    this.filePathViewer.onFolderSelected((path: string) => this.folderExplorerHandler.navigateTo(path));

    //Recupera dal DB l'ultimo file aperto.
    this.dbService.connect(() => {
      if (CacheHelper.getLastOpenedFile()) {
        this.fileViewerHandler.openNewFile(CacheHelper.getLastOpenedFile());
      } else {
        this.logger.warn("Non c'e nessun file in cache");
        this.fileViewer.showMessage("Selezionare un file da leggere");
      }

      if (CacheHelper.getLastOpenedFolder()) {
        this.folderExplorerHandler.navigateTo(CacheHelper.getLastOpenedFolder());
      } else {
        this.folderExplorerHandler.navigateToHomeDir();
      }
    });
    this.logger.debug("App initialized");
  }
}