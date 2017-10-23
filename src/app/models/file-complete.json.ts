import { FileJson } from './file.json';

export interface FileCompleteJson extends FileJson {
 rowsInFile?: number;
 lastRowRead?: number;
}