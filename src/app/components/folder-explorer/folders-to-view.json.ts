import { FileType } from './file-type';

export interface FoldersToViewJSON {
  elements: Array<FolderToViewJSON>;
}

export interface FolderToViewJSON {
  type: FileType;
  name: string;
}