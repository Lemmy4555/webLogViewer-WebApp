export interface FileInterface {
  path: string;
  readContent: Array<string>;
  rowsRead: number;
  size: number;
  encoding: string;
 }