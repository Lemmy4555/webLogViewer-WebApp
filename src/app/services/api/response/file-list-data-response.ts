import { FileDataReponse } from './file-data-response';

export class FileListDataResponse {
  public fileList: Array<FileDataReponse>;

  constructor(fileList: Array<FileDataReponse>) {
    this.fileList = fileList;
  }

}