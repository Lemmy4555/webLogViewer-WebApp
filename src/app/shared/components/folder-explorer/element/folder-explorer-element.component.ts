import { Component, Input } from "@angular/core";
import { FolderToViewJSON } from '../folders-to-view.json';
import { FoldersToView } from 'Components/folder-explorer/folders-to-view';
import { FileType } from '../file-type';

@Component({
  selector: "folder-explorer-element",
  templateUrl: "./folder-explorer-element.component.html",
  styleUrls: ["./folder-explorer-element.component.css"]
})
export class FolderExplorerElement {
  @Input() folderToView: FolderToViewJSON;

  private isFile() {
    return this.folderToView.type === FileType.FILE;
  }
}
