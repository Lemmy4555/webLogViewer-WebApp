import { Component, ViewChild } from '@angular/core';

@Component({
  selector: "row-input",
  templateUrl: "./row-input.component.html",
  styleUrls: ["./row-input.component.css"]
})
export class RowInput {
  private from: number;
  private to: number;

  private toKeyUp(event: KeyboardEvent, value: number) {
    this.from = value;
  }

  private fromKeyUp(event: KeyboardEvent, value: number) {
    this.to = value;
  }
}