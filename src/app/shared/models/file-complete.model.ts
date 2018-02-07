import { FileInterface } from './file.interface';
import { FileModel } from './file.model';
import { FileCompleteInterface } from './file-complete.interface';
import { ToJson } from './to-json.interface';
/**
 * Rappresenta un file da leggere per la webapp
 */
export class FileCompleteModel extends FileModel implements
  FileCompleteInterface, ToJson<FileCompleteInterface> {
  public rowsInFile: number;

  constructor(path: string, readContent: Array<string>,
    rowsRead: number, size: number, encoding: string,
    rowsInFile: number, currentPointer?: number) {
    super(path, readContent, rowsRead, size, encoding, currentPointer);

    /** Indica il numero di righe nel file */
    this.rowsInFile = rowsInFile;

  }

  public json(): FileCompleteInterface {
    return <FileCompleteInterface> this;
  }

  public static buildFromJson(json: any): FileCompleteModel {
    json.rowsRead = json.rowsRead == null ? 0 : json.rowsRead;
    json.size = json.size == null ? 0 : json.size;
    json.currentPointer = json.currentPointer == null ? 0 : json.currentPointer;
    return new FileCompleteModel(
      json.path, json.readContent, parseInt(json.rowsRead), parseInt(json.size),
      json.encoding, json.rowsInFile ? parseInt(json.rowsInFile) : null, parseInt(json.currentPointer)
    );
  }
}