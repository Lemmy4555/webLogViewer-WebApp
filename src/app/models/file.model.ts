import { ToJson } from './to-json';
import { FileJson } from 'Models/file.json';
/**
 * Rappresenta un file da leggere per la webapp
 */
export class File implements FileJson, ToJson<FileJson> {
  public path: string;
  public readContent: string;
  public rowsRead: number;
  public size: number;
  public encoding: string;

  constructor(path: string, readContent: string,
    rowsRead: number, size: number, encoding: string) {

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
  }

  public json(): FileJson {
    return <FileJson> this;
  }

  public static buildFromJson(json: any): File {
    json.rowsRead = json.rowsRead == null ? 0 : json.rowsRead;
    json.size = json.size == null ? 0 : json.size;
    return new File(json.path, json.readContent,
      parseInt(json.rowsRead), parseInt(json.size), json.encoding);
  }
}