import { ToJson } from './to-json.interface';
import { FileInterface } from 'Models/file.interface';
/**
 * Rappresenta un file da leggere per la webapp
 */
export class FileModel implements FileInterface, ToJson<FileInterface> {
  public path: string;
  public readContent: Array<string>;
  public rowsRead: number;
  public size: number;
  public encoding: string;
  public currentPointer: number;

  constructor(path: string, readContent: Array<string>,
    rowsRead: number, size: number, encoding: string, currentPointer?: number) {

    /** Percorso assoluto del file */
    this.path = path;
    /** Contenuto letto dalle API */
    this.readContent = readContent;
    /** Dimensione totale del file */
    this.size = size;
    /** Numero totale di righe lette */
    this.rowsRead = rowsRead;
    /** Encoding file */
    this.encoding = encoding;
    /** Last file pointer */
    this.currentPointer = currentPointer;
  }

  public json(): FileInterface {
    return <FileInterface> this;
  }

  public static buildFromJson(json: any): FileModel {
    let rowsRead = json.rowsRead == null ? 0 : json.rowsRead;
    let size = json.size == null ? 0 : json.size;
    let currentPointer = json.currentPointer ? parseInt(json.currentPointer) : null

    return new FileModel(json.path, json.readContent,
      parseInt(rowsRead), parseInt(size), json.encoding, currentPointer);
  }
}