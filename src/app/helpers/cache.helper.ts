export class CacheHelper {
    private static readonly keys = {
      lastOpenedFile: "last-opened-file",
      lastOpenedFolder: "last-opened-folder"
    }

    public static getLastOpenedFile(): string {
      return localStorage[CacheHelper.keys.lastOpenedFile];
    }
    
    public static setLastOpenedFile(lastOpenedFile: string): void {
      localStorage[CacheHelper.keys.lastOpenedFile] = lastOpenedFile;
    }

    public static getLastOpenedFolder(): string {
      return localStorage[CacheHelper.keys.lastOpenedFolder];
    }

    public static setLastOpenedFolder(lastOpenedFolder: string): void {
      localStorage[CacheHelper.keys.lastOpenedFolder] = lastOpenedFolder;
    }
}