import { Logger } from 'Logger/logger';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Rx';
import { FileHistoryModel } from 'Models/file-history.model';
import { FileHistoryInterface } from 'Models/file-history.interface';

@Injectable()
export class FileHistoryService {
  private logger: Logger = new Logger(this.constructor.name);

  private history: Array<FileHistoryInterface> = [];

  private _onHistoryChange: Observable<Array<FileHistoryInterface>>;
  private historyChangeObserver: any;

  constructor() {
    this.history = JSON.parse(localStorage.getItem("file-history") || "[]");
    this._onHistoryChange = Observable.create((observer) => {
      this.historyChangeObserver = observer;
    });
  }

  public addFileToHistory(file: FileHistoryModel): void {
    if(this.history.length && this.history[0].path == file.path) {
      return;
    }

    if (this.history.length > 30) {
      this.history.pop();
    }

    this.history.unshift(file.json());
    localStorage.setItem("file-history", JSON.stringify(this.history));

    this.historyChangeObserver.next(this.getHistory());
  }

  public getHistory(): Array<FileHistoryModel> {
    return this.history.map((e) => {
      return FileHistoryModel.buildFromJson(e);
    });
  }

  public get onHistoryChange() {
    return this._onHistoryChange;
  }
}
