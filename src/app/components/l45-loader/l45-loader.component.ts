import { Component } from "@angular/core";

@Component({
  selector: "l45-loader",
  templateUrl: "./l45-loader.component.html",
  styleUrls: ["./l45-loader.component.css"]
})
export class L45Loader {

  private isVisible: boolean = false;

  public showLoader = function () {
    this.isVisible = true;
  }

  public hideLoader = function () {
    this.isVisible = false
  }
}
