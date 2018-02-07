import { FileDataModel } from 'Models/file-data.model';

export class FileListDataModel {
  public fileList: Array<FileDataModel>;

  constructor(fileList: Array<FileDataModel>) {
    this.fileList = fileList;
  }

}