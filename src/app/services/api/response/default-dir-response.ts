import { FileDataReponse } from './file-data-response';
import { FileListDataResponse } from './file-list-data-response';

export interface DefaultDirResponse extends FileListDataResponse{
  path: string;
}