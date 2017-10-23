export class FileDataReponse {
  public name: string;
  public isFile: boolean;

  constructor(name: string, isFile: boolean) {
    this.name = name;
    this.isFile = isFile;
  }

  public static buildFromJson(json: any): FileDataReponse {
    return new FileDataReponse(
      json.name,
      json.isFile == "true"
    );
  }
}