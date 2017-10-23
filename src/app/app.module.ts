import { NgModule } from "@angular/core";
import { BrowserModule }  from "@angular/platform-browser";
import { HttpModule, JsonpModule } from '@angular/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { AppComponent } from "./app.component";
import { FolderExplorer } from "Components/folder-explorer/folder-explorer.component";
import { FolderExplorerElement } from "Components/folder-explorer/element/folder-explorer-element.component";
import { FilePathInputText } from "Components/file-path-input-text/file-path-input-text.component";
import { L45Loader } from "Components/l45-loader/l45-loader.component";
import { MessagesBox } from "Components/messages-box/message-box.component";
import { PopUpErrorLog } from "Components/pop-up-error-log/pop-up-error.component";
import { FileViewer } from "Components/file-viewer/file-viewer.component";
import { ApiService } from 'Services/api/api.service';
import { DbService } from 'Services/db/db.service';
import { PopUpErrorLogElement } from './components/pop-up-error-log/element/pop-up-error-element.component';
import { FilePathViewer } from 'Components/file-path-viewer/file-path-viewer.component';
import { BackgroundNotifications } from 'Components/background-notifications/background-notifications.component';
import { DbSvg } from 'Components/background-notifications/db-svg/db-svg.component';
import { FileSvg } from 'Components/background-notifications/file-svg/file-svg.component';
import { OkSvg } from 'Components/background-notifications/ok-svg/ok-svg.component';
import { DownloadSvg } from 'Components/background-notifications/download-svg/download-svg.component';
import { SyncSvg } from 'Components/background-notifications/sync-svg/file-svg.component';
import { WriteSvg } from 'Components/background-notifications/write-svg/file-svg.component';

import '../styles/styles.scss';

@NgModule({
  imports: [
    BrowserModule,
    HttpModule,
    JsonpModule,
    BrowserAnimationsModule
  ],
  declarations: [
    AppComponent,
    FolderExplorer,
    FilePathInputText,
    L45Loader,
    MessagesBox,
    FolderExplorerElement,
    PopUpErrorLog,
    FileViewer,
    PopUpErrorLogElement,
    FilePathViewer,
    BackgroundNotifications,
    DbSvg,
    FileSvg,
    OkSvg,
    DownloadSvg,
    SyncSvg,
    WriteSvg
  ],
  providers: [
    ApiService,
    DbService
  ],
  bootstrap: [ 
    AppComponent
  ]
})
export class AppModule { }
