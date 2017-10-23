import { Injectable } from "@angular/core";
import { Http, Response, Headers, RequestOptions, URLSearchParams } from "@angular/http";
import { Observable } from "rxjs/Rx";

import "rxjs/add/operator/map";
import "rxjs/add/operator/catch";
import { Constants } from "Util/constants";
import { FileDataReponse } from './response/file-data-response';
import { DefaultDirResponse } from './response/default-dir-response';
import { FileListDataResponse } from './response/file-list-data-response';
import { FileCompleteJson } from 'Models/file-complete.json';
import { FileJson } from 'Models/file.json';
import { GenericResponse } from './response/generic-response-json';
import { FileComplete } from 'Models/file-complete.model';
import { File } from 'Models/file.model';
import { Converter } from './converter';

@Injectable()
export class ApiService {
  private headers = new Headers({ 'Content-Type': 'application/json' }); // ... Set content type to JSON

  // Resolve HTTP using the constructor
  constructor(private http: Http) { }

  private options(params?: URLSearchParams): RequestOptions {
    var res = new RequestOptions({ headers: this.headers });
    if (params) {
      res.search = params;
    }
    return res;
  }

  public getFileData(filePath: string): Observable<FileDataReponse> {
    let params: URLSearchParams = new URLSearchParams();
    params.set("filePath", filePath);
    return this.http.get(Constants.API_HOME + "getFileData",
      this.options(params)
    ).map((res: Response) => res.json())
      .catch((error: GenericResponse) => {
        return Observable.throw(error)
      });
  }

  public getHomeDir(): Observable<DefaultDirResponse> {
    return this.http.get(Constants.API_HOME + "getHomeDir",
      this.options()
    ).map((res: Response) => res.json())
      .catch((error: GenericResponse) => {
        return Observable.throw(error)
      });
  }

  public getFileList(filePath: string): Observable<FileListDataResponse> {
    let params: URLSearchParams = new URLSearchParams();
    params.set("filePath", filePath);
    return this.http.get(Constants.API_HOME + "getFileList",
      this.options(params)
    ).map((res: Response) => res.json())
      .catch((error: GenericResponse) => {
        return Observable.throw(error)
      });
  }

  public getTailText(filePath: string, rowsFromEnd: number,
    isLengthToGet: boolean = false): Observable<FileComplete> {
    let params: URLSearchParams = new URLSearchParams();
    params.set("filePath", filePath);
    params.set("rowsFromEnd", rowsFromEnd.toString());
    params.set("getLength", isLengthToGet.toString());
    return this.http.get(Constants.API_HOME + "getTailText",
      this.options(params)
    ).map((res: Response) => Converter.toFileComplete(res.json(), filePath))
      .catch((error: GenericResponse) => {
        return Observable.throw(error)
      });
  }

  public getTextFromLine(filePath: string, lineFrom: number)
    : Observable<File> {
    let params: URLSearchParams = new URLSearchParams();
    params.set("filePath", filePath);
    params.set("lineFrom", lineFrom.toString());
    return this.http.get(Constants.API_HOME + "getTextFromLine",
      this.options(params)
    ).map((res: Response) => Converter.toFile(res.json(), filePath))
      .catch((error: GenericResponse) => {
        return Observable.throw(error)
      });
  }

  public getTextFromPointer(filePath: string, pointer: number,
    isTotRowsToGet: boolean = false): Observable<FileComplete> {
    let params: URLSearchParams = new URLSearchParams();
    params.set("filePath", filePath);
    params.set("pointer", pointer.toString());
    params.set("isTotRowsToGet", isTotRowsToGet.toString());
    return this.http.get(Constants.API_HOME + "getTextFromPointer",
      this.options(params)
    ).map((res: Response) => Converter.toFileComplete(res.json(), filePath))
      .catch((error: GenericResponse) => {
        return Observable.throw(error)
      });
  }

  public getFullFile(filePath: string): Observable<FileComplete> {
    let params: URLSearchParams = new URLSearchParams();
    params.set("filePath", filePath);
    return this.http.get(Constants.API_HOME + "getFullFile",
      this.options(params)
    ).map((res: Response) => Converter.toFileComplete(res.json(), filePath))
      .catch((error: GenericResponse) => {
        return Observable.throw(error)
      });
  }

}