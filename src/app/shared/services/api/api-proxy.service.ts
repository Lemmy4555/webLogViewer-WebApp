import { Injectable } from "@angular/core";
import { Http, Response, Headers, RequestOptions, URLSearchParams } from "@angular/http";
import { Observable } from "rxjs/Rx";

import "rxjs/add/operator/map";
import "rxjs/add/operator/catch";
import { CommonConstants } from "Constants/common";
import { FileDataCompleteModel } from 'Models/file-data-complete.model';
import { DefaultDirInterface } from 'Models/default-dir.interface';
import { FileListDataModel } from 'Models/file-list-data.model';
import { FileCompleteInterface } from 'Models/file-complete.interface';
import { FileInterface } from 'Models/file.interface';
import { GenericResponseInterface } from './response/generic-response.interface';
import { FileCompleteModel } from 'Models/file-complete.model';
import { FileModel } from 'Models/file.model';
import { Converter } from './converter';
import { ApiService } from './api.service';
import { ApiResponseModel } from './response/api-response.model';
import { ArrayUtils } from 'Utils/array-utils';

@Injectable()
export class ApiProxyService {
  private readonly isTotRowsToGetNextCalls: boolean = false;

  constructor(private api: ApiService) { }

  private handleApiError(observer: any, error: GenericResponseInterface) {
    observer.error(error);
  }

  public getFileData(filePath: string, isTotRowsToget?: boolean): Observable<FileDataCompleteModel> {
    return this.api.getFileData(filePath, isTotRowsToget);
  }

  public getHomeDir(): Observable<DefaultDirInterface> {
    return this.api.getHomeDir();
  }

  public getFileList(filePath: string): Observable<FileListDataModel> {
    return this.api.getFileList(filePath);
  }

  public getTailText(filePath: string, maxRowsToRead: number,
    isTotRowsToGet: boolean = true, pointer?: number): Observable<ApiResponseModel<FileCompleteModel>> {
    return Observable.create((observer) => {
      this.api.getTailText(filePath, maxRowsToRead, isTotRowsToGet, pointer).subscribe((genericResponse: GenericResponseInterface) => {
        let resETag: string = genericResponse.headers.get("etag");

        if (genericResponse.status == 304) {
          observer.next(new ApiResponseModel<any>(null, genericResponse.status, resETag));
          observer.complete();
          return;
        }

        let response: FileCompleteModel = Converter.toFileComplete(genericResponse.json(), filePath);
        let maxRowsToReadInt: number;
        if (maxRowsToRead == null) {
          maxRowsToReadInt = null;
        } else {
          maxRowsToReadInt = maxRowsToRead;
        }

        let rowsRead: number = response.rowsRead;
        let newPointer: number = response.currentPointer;
        if (maxRowsToRead != null && rowsRead == maxRowsToReadInt || newPointer == 0) {
          observer.next(new ApiResponseModel<FileCompleteModel>(response, genericResponse.status, resETag));
          observer.complete();
          return;
        }

        if (rowsRead <= 0) {
          observer.next(new ApiResponseModel<FileCompleteModel>(response, genericResponse.status, resETag));
          observer.complete();
          return;
        }

        let recursiveApiCall = () => {
          let totRowsRead: number = response.rowsRead;
          let responsePart: FileCompleteModel;
          if (maxRowsToReadInt != null) {
            maxRowsToReadInt -= totRowsRead;
          }
          this.api.getTailText(filePath, maxRowsToReadInt, this.isTotRowsToGetNextCalls, newPointer)
            .subscribe((genericResponsePart: GenericResponseInterface) => {
              let responsePart: FileCompleteModel = Converter.toFileComplete(genericResponse.json(), filePath);
              onRecursiveCallResponse(responsePart);
            }, (error: GenericResponseInterface) => this.handleApiError(observer, error));
        }

        let onRecursiveCallResponse = (responsePart: FileCompleteModel) => {
          rowsRead = responsePart.rowsRead;
          newPointer = responsePart.currentPointer;
          this.concatFileReponseAtBeginning(response, responsePart);
          if (maxRowsToReadInt != null && maxRowsToReadInt == response.rowsRead) {
            observer.next(new ApiResponseModel<FileCompleteModel>(response, genericResponse.status, resETag));
            observer.complete();
            return;
          } else if (newPointer == 0) {
            observer.next(new ApiResponseModel<FileCompleteModel>(response, genericResponse.status, resETag));
            observer.complete();
            return;
          }

          recursiveApiCall();
        }

        recursiveApiCall();

      }, (error: GenericResponseInterface) => this.handleApiError(observer, error))
    })
  }

  public getTextFromLine(filePath: string, maxRowsToRead: number,
    isTotRowsToGet: boolean = true, fromLine?: number): Observable<ApiResponseModel<FileCompleteModel>> {
    return Observable.create((observer) => {
      this.api.getTextFromLine(filePath, maxRowsToRead, isTotRowsToGet, fromLine).subscribe((genericResponse: GenericResponseInterface) => {
        let resETag: string = genericResponse.headers.get("etag");

        if (genericResponse.status == 304) {
          observer.next(new ApiResponseModel<any>(null, genericResponse.status, resETag));
          observer.complete();
          return;
        }

        let response: FileCompleteModel = Converter.toFileComplete(genericResponse.json(), filePath);
        let maxRowsToReadInt: number;
        if (maxRowsToRead == null) {
          maxRowsToReadInt = null;
        } else {
          maxRowsToReadInt = maxRowsToRead;
        }

        let fileLength: number = response.size;
        let newPointer: number = response.currentPointer;
        let rowsRead: number = response.rowsRead;

        if (rowsRead > 0 && newPointer != fileLength) {
          //The first line read is extra
          rowsRead--;
          response.rowsRead = rowsRead;
        }

        if ((maxRowsToRead != null && maxRowsToReadInt == rowsRead) || newPointer == fileLength) {
          observer.next(new ApiResponseModel<FileCompleteModel>(response, genericResponse.status, resETag));
          observer.complete();
          return;
        }

        if (rowsRead <= 0) {
          observer.next(new ApiResponseModel<FileCompleteModel>(response, genericResponse.status, resETag));
          observer.complete();
          return;
        }

        let recursiveApiCall = () => {
          let totRowsRead: number = response.rowsRead;

          let newMaxRowsToReadInt: number;
          if (maxRowsToReadInt != null) {
            newMaxRowsToReadInt = null;
          } else {
            newMaxRowsToReadInt = maxRowsToReadInt - totRowsRead
          }

          let responsePart: FileCompleteModel;
          this.api.getTextFromPointer(filePath, maxRowsToReadInt, this.isTotRowsToGetNextCalls, newPointer)
            .subscribe((genericResponsePart: GenericResponseInterface) => {
              let responsePart: FileCompleteModel = Converter.toFileComplete(genericResponse.json(), filePath);
              onRecursiveCallResponse(responsePart);
            }, (error: GenericResponseInterface) => this.handleApiError(observer, error));
        }

        let onRecursiveCallResponse = (responsePart: FileCompleteModel) => {
          rowsRead = responsePart.rowsRead;
          newPointer = responsePart.currentPointer;
          this.concatFileReponseAtTheEnd(response, responsePart);
          if (maxRowsToReadInt != null && maxRowsToReadInt == response.rowsRead) {
            observer.next(new ApiResponseModel<FileCompleteModel>(response, genericResponse.status, resETag));
            observer.complete();
            return;
          } else if (newPointer == fileLength) {
            observer.next(new ApiResponseModel<FileCompleteModel>(response, genericResponse.status, resETag));
            observer.complete();
            return;
          }
          recursiveApiCall();
        }

        recursiveApiCall();

      }, (error: GenericResponseInterface) => this.handleApiError(observer, error))
    })
  }

  public getTextFromPointer(filePath: string, maxRowsToRead: number,
    isTotRowsToGet: boolean = true, pointer?: number): Observable<ApiResponseModel<FileCompleteModel>> {
    return Observable.create((observer) => {
      this.api.getTextFromPointer(filePath, maxRowsToRead, isTotRowsToGet, pointer).subscribe((genericResponse: GenericResponseInterface) => {
        let resETag: string = genericResponse.headers.get("etag");
        
        if (genericResponse.status == 304) {
          observer.next(new ApiResponseModel<any>(null, genericResponse.status, resETag));
          observer.complete();
          return;
        }

        let response: FileCompleteModel = Converter.toFileComplete(genericResponse.json(), filePath);
        let maxRowsToReadInt: number;
        if (maxRowsToRead == null) {
          maxRowsToReadInt = null;
        } else {
          maxRowsToReadInt = maxRowsToRead;
        }

        let fileLength: number = response.size;
        let newPointer: number = response.currentPointer;
        let rowsRead: number = response.rowsRead;

        if ((maxRowsToRead != null && maxRowsToReadInt == rowsRead) || newPointer == fileLength) {
          observer.next(new ApiResponseModel<FileCompleteModel>(response, genericResponse.status, resETag));
          observer.complete();
          return;
        }

        if (rowsRead <= 0) {
          observer.next(new ApiResponseModel<FileCompleteModel>(response, genericResponse.status, resETag));
          observer.complete();
          return;
        }

        let recursiveApiCall = () => {
          let totRowsRead: number = response.rowsRead;

          let newMaxRowsToReadInt: number;
          if (maxRowsToReadInt != null) {
            newMaxRowsToReadInt = null;
          } else {
            newMaxRowsToReadInt = maxRowsToReadInt - totRowsRead
          }

          let responsePart: FileCompleteModel;
          this.api.getTextFromPointer(filePath, maxRowsToReadInt, this.isTotRowsToGetNextCalls, newPointer)
            .subscribe((genericResponsePart: GenericResponseInterface) => {
              let responsePart: FileCompleteModel = Converter.toFileComplete(genericResponse.json(), filePath);
              onRecursiveCallResponse(responsePart);
            }, (error: GenericResponseInterface) => this.handleApiError(observer, error));
        }

        let onRecursiveCallResponse = (responsePart: FileCompleteModel) => {
          rowsRead = responsePart.rowsRead;
          newPointer = responsePart.currentPointer;
          this.concatFileReponseAtTheEnd(response, responsePart);
          if (maxRowsToReadInt != null && maxRowsToReadInt == response.rowsRead) {
            observer.next(new ApiResponseModel<FileCompleteModel>(response, genericResponse.status, resETag));
            observer.complete();
            return;
          } else if (newPointer == fileLength) {
            observer.next(new ApiResponseModel<FileCompleteModel>(response, genericResponse.status, resETag));
            observer.complete();
            return;
          }
          recursiveApiCall();
        }

        recursiveApiCall();

      }, (error: GenericResponseInterface) => this.handleApiError(observer, error))
    });
  }

  public getFullFile(filePath: string, maxRowsToRead: number, isTotRowsToGet?: boolean): Observable<ApiResponseModel<FileCompleteModel>> {
    return this.getTextFromLine(filePath, maxRowsToRead, isTotRowsToGet, 0);
  }

  private concatFileReponseAtBeginning(response: FileCompleteModel, toConcat: FileCompleteModel): FileCompleteModel {

    let content: Array<string> = [];

    if (response.readContent.length > 0) {
      let lastLineToConcat: string = ArrayUtils.getLast(toConcat.readContent) as string;
      let firstLineRes: string = ArrayUtils.getFirst(response.readContent) as string;
      if (lastLineToConcat.endsWith("\r")) {
        if (firstLineRes == "\n") {
          ArrayUtils.removeLast(toConcat.readContent);
          lastLineToConcat = lastLineToConcat.concat(firstLineRes);
          ArrayUtils.set(response.readContent, 0, lastLineToConcat);
        }
      } else if (!lastLineToConcat.endsWith("\n")) {
        ArrayUtils.removeLast(toConcat.readContent);
        lastLineToConcat = lastLineToConcat.concat(firstLineRes);
        ArrayUtils.set(response.readContent, 0, lastLineToConcat);
      }
    }

    content = content.concat(toConcat.readContent);
    content = content.concat(response.readContent);
    response.readContent = content;
    let totRowsRead: number = response.rowsRead + toConcat.rowsRead;
    response.rowsRead = totRowsRead;
    response.currentPointer = toConcat.currentPointer;
    return response;
  }

  private concatFileReponseAtTheEnd(response: FileCompleteModel, toConcat: FileCompleteModel): FileCompleteModel {

    let content: Array<string> = [];
		
		if(response.readContent.length > 0) {
			let lastLineToConcat: string = ArrayUtils.getLast(toConcat.readContent);
			let firstLineRes: string = ArrayUtils.getFirst(response.readContent);
			if(lastLineToConcat.endsWith("\r")) {
				if(firstLineRes == "\n") {
					ArrayUtils.removeLast(toConcat.readContent);
					lastLineToConcat = lastLineToConcat.concat(firstLineRes);
          ArrayUtils.set(response.readContent, 0, lastLineToConcat);
				}
			} else if(!lastLineToConcat.endsWith("\n")) {
				ArrayUtils.removeLast(toConcat.readContent);
				lastLineToConcat = lastLineToConcat.concat(firstLineRes);
				ArrayUtils.set(response.readContent, 0, lastLineToConcat);
			}
		}
		
		content = content.concat(toConcat.readContent);
		content = content.concat(response.readContent);
		response.readContent = content;
		let totRowsRead: number = response.rowsRead + toConcat.rowsRead;
		response.rowsRead = totRowsRead;
		response.currentPointer = toConcat.currentPointer;
		return response;
  }

}