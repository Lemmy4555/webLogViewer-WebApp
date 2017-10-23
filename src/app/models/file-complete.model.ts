import { FileJson } from './file.json';
import { File } from './file.model';
import { FileCompleteJson } from './file-complete.json';
import { ToJson } from './to-json';
/**
 * Rappresenta un file da leggere per la webapp
 */
export class FileComplete extends File implements
  FileCompleteJson, ToJson<FileCompleteJson> {
  public rowsInFile: number;
  public lastRowRead: number;

  constructor(path: string, readContent: string,
    rowsRead: number, size: number, encoding: string,
    rowsInFile: number, lastRowRead?: number) {
    super(path, readContent, rowsRead, size, encoding);

    /** Indica il numero di righe nel file */
    this.rowsInFile = rowsInFile;

    /** Indica l'ultima riga letta nel file */
    this.lastRowRead = lastRowRead | rowsInFile;
  }

  public json(): FileCompleteJson {
    return <FileCompleteJson> this;
  }

  public static buildFromJson(json: any): FileComplete {
    json.rowsRead = json.rowsRead == null ? 0 : json.rowsRead;
    json.size = json.size == null ? 0 : json.size;
    json.rowsInFile = json.rowsInFile == null ? 0 : json.rowsInFile;
    json.lastRowRead = json.lastRowRead == null ? 0 : json.lastRowRead;
    return new FileComplete(
      json.path, json.readContent, parseInt(json.rowsRead), parseInt(json.size),
      json.encoding, parseInt(json.rowsInFile), parseInt(json.lastRowRead)
    );
  }
}