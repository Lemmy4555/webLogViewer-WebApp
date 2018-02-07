import { ToJson } from './to-json.interface';
import { FileDataInterface } from 'Models/file-data.interface';

export class FileDataModel implements FileDataInterface {
  public name: string;
  public isFile: boolean;

  constructor(name: string, isFile: boolean) {
    this.name = name;
    this.isFile = isFile;
  }

  public static buildFromJson(json: any): FileDataModel {
    return new FileDataModel(
      json.name,
      json.isFile == "true"
    );
  }
}