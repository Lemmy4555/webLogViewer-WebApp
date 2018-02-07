import { Component, ViewChild, Output, EventEmitter } from '@angular/core';
import { FileHistoryService } from 'Services/file-history/file-history.service';
import { FileHistoryModel } from 'Models/file-history.model';
import { FileHistoryInterface } from 'Models/file-history.interface';


@Component({
  selector: "file-history",
  templateUrl: "./file-history.component.html",
  styleUrls: ["./file-history.component.css"]
})
export class FileHistory {
  private history: Array<FileHistoryModel> = [];
  @Output("onFileOpen") 
  private onFileOpen: EventEmitter<string> = new EventEmitter();
  @Output("onClose") 
  private onClose: EventEmitter<null> = new EventEmitter();

  fileHistoryService: FileHistoryService;

  constructor(fileHistoryService: FileHistoryService) {
    this.fileHistoryService = fileHistoryService;

    this.history = this.fileHistoryService.getHistory();
    this.fileHistoryService.onHistoryChange.subscribe((history: Array<FileHistoryModel>) => {
      this.history = history;
    });
  }

  private openFile(name, path) {
    let fileHistory = new FileHistoryModel(path, name);
    this.fileHistoryService.addFileToHistory(fileHistory);
    this.onFileOpen.emit(path);
  }

  private close() {
    this.onClose.emit();
  }
}