import { Component, ViewChild, Output, EventEmitter } from '@angular/core'
import { element } from 'protractor';
import { CacheHelper } from 'Helpers/cache.helper';

@Component({
  selector: "row-input",
  templateUrl: "./row-input.component.html",
  styleUrls: ["./row-input.component.css"]
})
export class RowInput {
  private from: number
  private to: number
  private path: string
  private error: string

  @Output("onRequestFileOpen")
  private onRequestFileOpen: EventEmitter<object> = new EventEmitter()

  private inputFilter(event: KeyboardEvent, value: number) {
    this.error = null
    if (event.keyCode == 45 || event.keyCode == 43) {
      return false
    }
  }

  private validate() {
    let toVal: number = this.to || 0
    let fromVal: number = this.from || 0
    if (fromVal > toVal) {
      this.error = "Value \"From\" should be lower than \"To\""
      return false
    }

    return true
  }

  private requestFileOpen() {
    if (!this.validate()) {
      return
    }

    this.onRequestFileOpen.emit({
      path: CacheHelper.getLastOpenedFile(),
      from: this.from || 0,
      to: this.to || 0
    })
  }

  private focusToEndOfValue(element: HTMLInputElement, value: number) {
    let valLength = value ? value.toString().length : 0
    element.type = "text"
    element.setSelectionRange(valLength, valLength)
    element.type = "number"
  }
}