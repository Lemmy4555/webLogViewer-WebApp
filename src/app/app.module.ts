import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import {
  NgModule,
  ApplicationRef
} from '@angular/core';
import {
  removeNgStyles,
  createNewHosts,
  createInputTransfer
} from '@angularclass/hmr';
import {
  RouterModule,
  PreloadAllModules
} from '@angular/router';

import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

/*
 * Platform and Environment providers/directives/pipes
 */
import { ENV_PROVIDERS } from './environment';
import { ROUTES } from './app.routes';
// App is our top level component
import { AppComponent } from './app.component';
import { APP_RESOLVER_PROVIDERS } from './app.resolver';
import { AppState, InternalStateType } from './app.service';
import { HomeComponent } from './home';
import { AboutComponent } from './about';

import { NoContentComponent } from './no-content';
import { XLargeDirective } from './home/x-large';

import { FolderExplorer } from "Components/folder-explorer/folder-explorer.component";
import { FolderExplorerElement } from "Components/folder-explorer/element/folder-explorer-element.component";
import { FilePathInputText } from "Components/file-path-input-text/file-path-input-text.component";
import { L45Loader } from "Components/l45-loader/l45-loader.component";
import { MessagesBox } from "Components/messages-box/message-box.component";
import { PopUpErrorLog } from "Components/pop-up-error-log/pop-up-error.component";
import { FileViewer } from "Components/file-viewer/file-viewer.component";
import { ApiService } from 'Services/api/api.service';
import { ApiProxyService } from 'Services/api/api-proxy.service';
import { DbService } from 'Services/db/db.service';
import { PopUpErrorLogElement } from 'Components/pop-up-error-log/element/pop-up-error-element.component';
import { FilePathViewer } from 'Components/file-path-viewer/file-path-viewer.component';
import { BackgroundNotifications } from 'Components/background-notifications/background-notifications.component';
import { DbSvg } from 'Components/background-notifications/db-svg/db-svg.component';
import { FileSvg } from 'Components/background-notifications/file-svg/file-svg.component';
import { OkSvg } from 'Components/background-notifications/ok-svg/ok-svg.component';
import { DownloadSvg } from 'Components/background-notifications/download-svg/download-svg.component';
import { SyncSvg } from 'Components/background-notifications/sync-svg/file-svg.component';
import { WriteSvg } from 'Components/background-notifications/write-svg/file-svg.component';
import { RowInput } from 'Components/row-input/row-input.component';
import { ArrowUp } from 'Components/arrow-up/arrow-up.component';
import { FileViewerToolbar } from 'Components/file-viewer-toolbar/file-viewer-toolbar.component';
import { FileHistoryService } from "Services/file-history/file-history.service";
import { FileHistory } from 'Components/files-history/file-history.component';

import '../styles/styles.scss';
import '../styles/headings.css';

// Application wide providers
const APP_PROVIDERS = [
  ...APP_RESOLVER_PROVIDERS,
  AppState
];

type StoreType = {
  state: InternalStateType,
  restoreInputValues: () => void,
  disposeOldHosts: () => void
};

/**
 * `AppModule` is the main entry point into Angular2's bootstraping process
 */
@NgModule({
  bootstrap: [ AppComponent ],
  declarations: [
    AppComponent,
    AboutComponent,
    HomeComponent,
    NoContentComponent,
    XLargeDirective,

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
    WriteSvg,
    RowInput,
    ArrowUp,
    FileViewerToolbar,
    FileHistory
  ],
  /**
   * Import Angular's modules.
   */
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    FormsModule,
    HttpModule,
    RouterModule.forRoot(ROUTES, {
      useHash: Boolean(history.pushState) === false,
      preloadingStrategy: PreloadAllModules
    })
  ],
  /**
   * Expose our Services and Providers into Angular's dependency injection.
   */
  providers: [
    ENV_PROVIDERS,
    APP_PROVIDERS,
    ApiService,
    DbService,
    ApiProxyService,
    FileHistoryService
  ]
})
export class AppModule {

  constructor(
    public appRef: ApplicationRef,
    public appState: AppState
  ) {}

  public hmrOnInit(store: StoreType) {
    if (!store || !store.state) {
      return;
    }
    console.log('HMR store', JSON.stringify(store, null, 2));
    /**
     * Set state
     */
    this.appState._state = store.state;
    /**
     * Set input values
     */
    if ('restoreInputValues' in store) {
      let restoreInputValues = store.restoreInputValues;
      setTimeout(restoreInputValues);
    }

    this.appRef.tick();
    delete store.state;
    delete store.restoreInputValues;
  }

  public hmrOnDestroy(store: StoreType) {
    const cmpLocation = this.appRef.components.map((cmp) => cmp.location.nativeElement);
    /**
     * Save state
     */
    const state = this.appState._state;
    store.state = state;
    /**
     * Recreate root elements
     */
    store.disposeOldHosts = createNewHosts(cmpLocation);
    /**
     * Save input values
     */
    store.restoreInputValues  = createInputTransfer();
    /**
     * Remove styles
     */
    removeNgStyles();
  }

  public hmrAfterDestroy(store: StoreType) {
    /**
     * Display new elements
     */
    store.disposeOldHosts();
    delete store.disposeOldHosts;
  }

}
