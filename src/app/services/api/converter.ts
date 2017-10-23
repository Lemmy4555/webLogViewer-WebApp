import { File } from 'Models/file.model';
import { FileCompleteJson } from 'Models/file-complete.json';
import { FileJson } from 'Models/file.json';
import { FileComplete } from 'Models/file-complete.model';

export class Converter {
  public static toFile(json: FileJson, path: string): File {
    json.path = path;
    return File.buildFromJson(json);
  }

  public static toFileComplete(json: FileCompleteJson, path: string): FileComplete {
    json.path = path;
    return FileComplete.buildFromJson(json);
  }
}