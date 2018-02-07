import { Injectable } from "@angular/core";
import { Http, Response, Headers, RequestOptions, URLSearchParams } from "@angular/http";
import { Observable } from "rxjs/Rx";

import "rxjs/add/operator/map";
import "rxjs/add/operator/catch";
import { CommonConstants } from "Constants/common";
import { DefaultDirInterface } from 'Models/default-dir.interface';
import { FileListDataModel } from 'Models/file-list-data.model';
import { FileCompleteInterface } from 'Models/file-complete.interface';
import { FileInterface } from 'Models/file.interface';
import { GenericResponseInterface } from './response/generic-response.interface';
import { FileCompleteModel } from 'Models/file-complete.model';
import { FileModel } from 'Models/file.model';
import { Converter } from './converter';
import { FileDataCompleteModel } from 'Models/file-data-complete.model';

@Injectable()
export class ApiService {
  private headers = new Headers({
    'Content-Type': 'application/json', // ... Set content type to JSON
    'Pragma': 'no-cache'
  });

  // Resolve HTTP using the constructor
  constructor(private http: Http) { }

  private options(params?: URLSearchParams): RequestOptions {
    var res = new RequestOptions({ headers: this.headers });
    if (params) {
      res.search = params;
    }
    return res;
  }

  public getFileData(filePath: string, isTotRowsToget?: boolean): Observable<FileDataCompleteModel> {
    let params: URLSearchParams = new URLSearchParams();
    params.set("filePath", filePath);
    if(isTotRowsToget) {
      params.set("isTotRowsToget", isTotRowsToget.toString());
    }

    return this.http.get(CommonConstants.API_HOME + "getFileData",
      this.options(params)
    ).map((res: Response) => res.json())
      .catch((error: GenericResponseInterface) => {
        return Observable.throw(error)
      });
  }

  public getHomeDir(): Observable<DefaultDirInterface> {
    return this.http.get(CommonConstants.API_HOME + "getHomeDir",
      this.options()
    ).map((res: Response) => res.json())
      .catch((error: GenericResponseInterface) => {
        return Observable.throw(error)
      });
  }

  public getFileList(filePath: string): Observable<FileListDataModel> {
    let params: URLSearchParams = new URLSearchParams();
    params.set("filePath", filePath);
    return this.http.get(CommonConstants.API_HOME + "getFileList",
      this.options(params)
    ).map((res: Response) => res.json())
      .catch((error: GenericResponseInterface) => {
        return Observable.throw(error)
      });
  }

  public getTailText(filePath: string, maxRowsToRead?: number,
    isTotRowsToGet: boolean = false, pointer?: number): Observable<GenericResponseInterface> {
    let params: URLSearchParams = new URLSearchParams();
    params.set("filePath", filePath);
    params.set("isTotRowsToGet", isTotRowsToGet.toString());
    if (maxRowsToRead != null) {
      params.set("maxRowsToRead", maxRowsToRead.toString());
    }
    if (pointer != null) {
      params.set("pointer", pointer.toString());
    }

    return this.http.get(CommonConstants.API_HOME + "getTailText",
      this.options(params)
    ).map((res: Response) => {
      return res as any as GenericResponseInterface
    }).catch((error: GenericResponseInterface) => {
      return Observable.throw(error)
    });
  }

  public getTextFromLine(filePath: string, maxRowsToRead?: number,
    isTotRowsToGet: boolean = false, fromLine?: number): Observable<GenericResponseInterface> {
    let params: URLSearchParams = new URLSearchParams();
    params.set("filePath", filePath);
    params.set("isTotRowsToGet", isTotRowsToGet.toString());
    if (maxRowsToRead != null) {
      params.set("maxRowsToRead", maxRowsToRead.toString());
    }
    if (fromLine != null) {
      params.set("fromLine", fromLine.toString());
    }
    return this.http.get(CommonConstants.API_HOME + "getTextFromLine",
      this.options(params)
    ).map((res: Response) => {
      return res as any as GenericResponseInterface
    }).catch((error: GenericResponseInterface) => {
      return Observable.throw(error)
    });
  }

  public getTextFromPointer(filePath: string, maxRowsToRead?: number,
    isTotRowsToGet: boolean = false, pointer?: number): Observable<GenericResponseInterface> {
    let params: URLSearchParams = new URLSearchParams();
    params.set("filePath", filePath);
    if (maxRowsToRead != null) {
      params.set("maxRowsToRead", maxRowsToRead.toString());
    }
    if (pointer != null) {
      params.set("pointer", pointer.toString());
    }
    return this.http.get(CommonConstants.API_HOME + "getTextFromPointer",
      this.options(params)
    ).map((res: Response) => {
      return res as any as GenericResponseInterface
    }).catch((error: GenericResponseInterface) => {
      return Observable.throw(error)
    });
  }

  public getFullFile(filePath: string): Observable<FileCompleteModel> {
    // let params: URLSearchParams = new URLSearchParams();
    // params.set("filePath", filePath);
    // return this.http.get(CommonConstants.API_HOME + "getFullFile",
    //   this.options(params)
    // ).map((res: Response) => Converter.toFileComplete(res.json(), filePath))
    //   .catch((error: GenericResponseInterface) => {
    //     return Observable.throw(error)
    //   });
    throw Error("Doesn't exists anymore")
  }

}