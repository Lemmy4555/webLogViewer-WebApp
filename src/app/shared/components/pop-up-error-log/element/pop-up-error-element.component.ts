import { Component, Input, OnInit, ElementRef, ViewChild, Output, EventEmitter } from '@angular/core';
import { PopUpErrorLogElementWrapper } from '../pop-up-error.component';
import {
  trigger,
  state,
  style,
  animate,
  transition,
  group
} from '@angular/animations';

@Component({
  selector: "pop-up-error-log-element",
  templateUrl: "./pop-up-error-element.component.html",
  styleUrls: ["./pop-up-error-element.component.css"]
})
export class PopUpErrorLogElement implements OnInit {
  @Input("wrapper")
  private _wrapper: PopUpErrorLogElementWrapper = null;

  @Output("onClose")
  private onCloseClick: EventEmitter<PopUpErrorLogElementWrapper> = new EventEmitter();

  @ViewChild("main")
  public elementRef: ElementRef;

  private _onCloseInnerClick() {
    this.onCloseClick.emit(this._wrapper);
  }

  set wrapper(newMessage: string) {
    this._wrapper.text = newMessage;
  }
  
  get wrapper(): string {
    return this._wrapper.text;
  }

  public ngOnInit() {
    this._wrapper.component = this;
  }

}