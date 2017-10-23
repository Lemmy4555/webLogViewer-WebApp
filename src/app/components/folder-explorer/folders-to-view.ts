import { FoldersToViewJSON, FolderToViewJSON } from './folders-to-view.json';
import { FileListDataResponse } from 'Services/api/response/file-list-data-response';
import { FileType } from './file-type';

export class FoldersToView implements FoldersToViewJSON {
  public elements:Array<FolderToViewJSON> = [];

  public static buildFromFileListDataResponse(res: FileListDataResponse) {
    let result: FoldersToView = new FoldersToView();
    result.elements = [];
    res.fileList.forEach((e => {
      result.elements.push({
        type: e.isFile ? FileType.FILE : FileType.FOLDER,
        name: e.name
      });
    }));
    return result;
  }

  public static buildFromJson(json: FoldersToViewJSON) {
    let result: FoldersToView = new FoldersToView();
    result.elements = <Array<FolderToViewJSON>> json.elements;
    return result;
  }
}