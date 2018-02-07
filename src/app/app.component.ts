import { Component, ViewChild, OnInit, ElementRef } from '@angular/core';

import { FolderExplorer } from 'Components/folder-explorer/folder-explorer.component';
import { FilePathInputText } from 'Components/file-path-input-text/file-path-input-text.component';
import { PopUpErrorLog } from 'Components/pop-up-error-log/pop-up-error.component';
import { ApiProxyService } from 'Services/api/api-proxy.service';
import { FileViewerHandler } from 'Handlers/file-viewer.handler';
import { DbService } from 'Services/db/db.service';
import { FileViewer } from 'Components/file-viewer/file-viewer.component';
import { CacheHelper } from 'Helpers/cache.helper';
import { Logger } from 'Logger/logger';
import { FilePathViewer } from 'Components/file-path-viewer/file-path-viewer.component';
import { BackgroundNotifications } from 'Components/background-notifications/background-notifications.component';
import { FileViewerToolbar } from 'Components/file-viewer-toolbar/file-viewer-toolbar.component';

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
  @ViewChild(FileViewerToolbar)
  private fileViewerToolbar: FileViewerToolbar;

  private apiProxyService: ApiProxyService;
  private dbService: DbService;

  private fileViewerHandler: FileViewerHandler;

  private elementRef: ElementRef;

  private isRightContentOpen: boolean = false;

  constructor(elementRef: ElementRef, apiProxyService: ApiProxyService, dbService: DbService) {
    this.apiProxyService = apiProxyService;
    this.dbService = dbService;
    this.elementRef = elementRef;
  }

  public ngOnInit() {
    this.logger.debug("Initializing app");
    this.fileViewerHandler = new FileViewerHandler(this.fileViewer, this.apiProxyService, this.dbService);

    this.fileViewerHandler
      .onOpenNewFileError((message: string) => { this.fileViewerToolbar.backgroundNotifications.hideAll(); this.fileViewer.showMessage(message); })
      .onUnhandledError((message: string) => { this.popUpErrorLog.showLog(message); })
      .onSyncronizationStarted(() => { this.fileViewerToolbar.backgroundNotifications.showSyncNotification(); })
      .onSyncronizationFinished(() => { this.fileViewerToolbar.backgroundNotifications.hideSyncNotification(); })
      .onFileTailStarted(() => { this.fileViewerToolbar.backgroundNotifications.showDownloadNotification(); })
      .onFileTailed(() => { this.fileViewerToolbar.backgroundNotifications.hideDownloadNotification(); })
      .onWriteJobStart(() => { this.fileViewerToolbar.backgroundNotifications.showWriteNotification(); })
      .onWriteJobEnd(() => { this.fileViewerToolbar.backgroundNotifications.showOkNotification(); })
      .onFullFileDownloadStarted(() => { this.fileViewerToolbar.backgroundNotifications.showFileNotification(); })
      .onFullFileDownloaded(() => { this.fileViewerToolbar.backgroundNotifications.hideFileNotification(); });

    this.filePathInputText.onPathInsert((path: string) => this.folderExplorer.navigateTo(path));
    this.filePathViewer.onFolderSelected((path: string) => this.folderExplorer.navigateTo(path));

    //Recupera dal DB l'ultimo file aperto.
    this.dbService.connect(() => {
      if (CacheHelper.getLastOpenedFile()) {
        this.fileViewerHandler.openNewFile(CacheHelper.getLastOpenedFile());
      } else {
        this.logger.warn("Non c'e nessun file in cache");
        this.fileViewer.showMessage("Selezionare un file da leggere");
      }

      if (CacheHelper.getLastOpenedFolder()) {
        this.folderExplorer.navigateTo(CacheHelper.getLastOpenedFolder());
      } else {
        this.folderExplorer.navigateToHomeDir();
      }
    });
    this.logger.debug("App initialized");
  }

  openRightContent() {
    this.isRightContentOpen = true;
  }

  closeRightContent() {
    this.isRightContentOpen = false;
  }

}