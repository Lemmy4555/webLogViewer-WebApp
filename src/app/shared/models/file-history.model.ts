import { ToJson } from './to-json.interface';
import { FileInterface } from 'Models/file.interface';
import { FileHistoryInterface } from 'Models/file-history.interface';

export class FileHistoryModel implements FileHistoryInterface, ToJson<FileHistoryInterface> {
  public path: string;
  public name: string;

  constructor(path: string, name: string) {
    /** Percorso assoluto del file */
    this.path = path;
    /** Contenuto letto dalle API */
    this.name = name;
  }

  public json(): FileHistoryInterface {
    return <FileHistoryInterface> this;
  }

  public static buildFromJson(json: any): FileHistoryModel {
    return new FileHistoryModel(json.path, json.name);
  }
}