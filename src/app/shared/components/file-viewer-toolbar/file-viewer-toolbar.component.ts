import { Component, ViewChild, Output, EventEmitter } from '@angular/core'
import { BackgroundNotifications } from 'Components/background-notifications/background-notifications.component'

/**
 * Explorer used to navigate in folders of the server's file-system.
 */
@Component({
  selector: "file-viewer-toolbar",
  templateUrl: "./file-viewer-toolbar.component.html",
  styleUrls: ["./file-viewer-toolbar.component.css"]
})
export class FileViewerToolbar {
  @ViewChild(BackgroundNotifications)
  public backgroundNotifications: BackgroundNotifications

  @Output("onRequestFileOpen")
  private onRequestFileOpen: EventEmitter<string> = new EventEmitter()
}
