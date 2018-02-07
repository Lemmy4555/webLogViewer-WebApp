import { FileInterface } from './file.interface';

export interface FileCompleteInterface extends FileInterface {
 rowsInFile?: number;
 lastRowRead?: number;
}