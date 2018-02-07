import { FileDataModel } from './file-data.model';

export class FileDataCompleteModel extends FileDataModel{
  public name: string;
  public isFile: boolean;
  public rowsInFile: number;

  constructor(name: string, isFile: boolean, rowsInFile?: number) {
    super(name, isFile);
    this.rowsInFile = rowsInFile;
  }

  public static buildFromJson(json: any): FileDataCompleteModel {
    let rowsInFile: number = json.rowsInFile ? parseInt(json.rowsInFile) : null;

    return new FileDataCompleteModel(
      json.name,
      json.isFile == "true",
      rowsInFile
    );
  }
}