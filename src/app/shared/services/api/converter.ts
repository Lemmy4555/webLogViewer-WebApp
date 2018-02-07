import { FileModel } from 'Models/file.model';
import { FileCompleteInterface } from 'Models/file-complete.interface';
import { FileInterface } from 'Models/file.interface';
import { FileCompleteModel } from 'Models/file-complete.model';

export class Converter {
  public static toFile(json: FileInterface, path: string): FileModel {
    json.path = path;
    return FileModel.buildFromJson(json);
  }

  public static toFileComplete(json: FileCompleteInterface, path: string): FileCompleteModel {
    json.path = path;
    return FileCompleteModel.buildFromJson(json);
  }
}