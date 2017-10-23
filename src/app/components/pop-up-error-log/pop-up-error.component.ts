import { Component, ViewChild, ElementRef, ViewChildren } from '@angular/core';
import { PopUpErrorLogElement } from './element/pop-up-error-element.component';
import { Logger } from 'Logger/logger';

@Component({
  selector: "pop-up-error-log",
  templateUrl: "./pop-up-error.component.html",
  styleUrls: ["./pop-up-error.component.css"]
})
export class PopUpErrorLog {
  private logger: Logger = new Logger(this.constructor.name);

  private popUpErrorLogElements: Array<PopUpErrorLogElementWrapper> = [];

  @ViewChildren("listItem")
  private listItems: Array<ElementRef> = [];

  private increment: number = 0;

  public showLog(message: string): void {
    let wrapper: PopUpErrorLogElementWrapper = new PopUpErrorLogElementWrapper(message);
    this.addElement(wrapper);
  }
  
  public closeLastElement(): void {
    let filtered = this.popUpErrorLogElements.filter((e: PopUpErrorLogElementWrapper) => {
      return e.show;
    });
    var lastElement = filtered[filtered.length - 1];
    this.removeElement(lastElement);
  }

  private addElement(toAdd: PopUpErrorLogElementWrapper) {
    this.popUpErrorLogElements.unshift(toAdd);
    setTimeout(() => {
      toAdd.show = true;
      this.keepMessagesListHeightUnder70();
    }, 100);
  }

  private removeElement(toRemove: PopUpErrorLogElementWrapper) {
    toRemove.show = false;
    setTimeout(() => {
      this.effectiveRemoveElement(toRemove);
    }, 200);
  }

  private effectiveRemoveElement(toRemove: PopUpErrorLogElementWrapper) {
    let i = this.popUpErrorLogElements.indexOf(toRemove);
    this.popUpErrorLogElements.splice(i, 1);
  }

  private calcMesssagesListSizeInPercentage() {
    var totHeight = 0;
    this.listItems.forEach((e: ElementRef, i) => {
      if(this.popUpErrorLogElements[i].show) {
        totHeight += $(e.nativeElement).outerHeight(true);
      }
    });
    if(totHeight > $(window).outerHeight(true)) {
      return 100;
    }
    return 100 - (($(window).outerHeight(true) - totHeight) / $(window).outerHeight(true) * 100);
  }

  /**
   * Mantiene l'altezza della lista dei messaggi sotto il 70%
   */
  private keepMessagesListHeightUnder70() {
    if(this.calcMesssagesListSizeInPercentage() > 70) {
      this.closeLastElement();
      this.keepMessagesListHeightUnder70();
    }
  }
}

export class PopUpErrorLogElementWrapper {
  public show: boolean = false;
  public text: string;
  public component: PopUpErrorLogElement;

  constructor(message: string) {
    this.text = message;
  }
}

export class ErrorMessageState {
  public static readonly SHOW: ErrorMessageState = new ErrorMessageState("show");
  public static readonly HIDE: ErrorMessageState = new ErrorMessageState("hide");

  private constructor(public value: string) {

  }

  private static values: Array<string> = [
    ErrorMessageState.SHOW.value,
    ErrorMessageState.HIDE.value
  ]

  public static getInstance(value: string): ErrorMessageState {
    if(ErrorMessageState.values.indexOf(value) !== -1) {
      return new ErrorMessageState(value);
    }
  }
}