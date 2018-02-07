import { FoldersToViewJSON, FolderToViewJSON } from './folders-to-view.json';
import { FileListDataModel } from 'Models/file-list-data.model';
import { FileType } from './file-type';

export class FoldersToView implements FoldersToViewJSON {
  public elements:Array<FolderToViewJSON> = [];

  public static buildFromFileListDataResponse(res: FileListDataModel) {
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