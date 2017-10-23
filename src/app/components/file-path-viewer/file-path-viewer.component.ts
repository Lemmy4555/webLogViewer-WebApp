import { Component, Input } from '@angular/core';
import { CommonUtils } from 'Util/common-utils';

@Component({
  selector: "file-path-viewer",
  templateUrl: "./file-path-viewer.component.html",
  styleUrls: ["./file-path-viewer.component.css"]
})
export class FilePathViewer {
  @Input("path")
  private _path: Array<string> = [];

  private _onFolderSelected: (path: string) => void = (path: string) => {};

  private onFolderSelectedInner(index: number): void {
    let path: string = CommonUtils.fromArrayToUnixPath(this._path.slice(0, index + 1));
    this._onFolderSelected(path);
  }

  set path(path: Array<string>) {
    this._path = path;
  }

  get path(): Array<string> {
    return this._path;
  }

  public onFolderSelected(callback: (path: string) => void): FilePathViewer {
    if(!callback) {
      callback = (path: string) => {};
    }
    this._onFolderSelected = callback;
    return this;
  }
}
