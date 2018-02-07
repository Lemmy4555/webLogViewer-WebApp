import { Component, ViewChild } from "@angular/core";

@Component({
  selector: "messages-box",
  templateUrl: "./message-box.component.html",
  styleUrls: ["./message-box.component.css"]
})
export class MessagesBox {
  private message: string = "";
  private isVisible: boolean = false;

  public showMessage = function (message: string): void {
    this.message = message;
    this.isVisible = true;
  }

  public closeMessage = function (): void {
    this.message = "";
    this.isVisible = false;
  }
}
