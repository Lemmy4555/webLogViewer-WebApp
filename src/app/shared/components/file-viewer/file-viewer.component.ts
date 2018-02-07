import { Component, ViewChild, ElementRef, EventEmitter, Output } from '@angular/core';
import { Logger } from 'Logger/logger';
import { MessagesBox } from 'Components/messages-box/message-box.component';
import * as styleVar from './file-viewer.component.json';
import { CommonConstants } from 'Constants/common';
import { L45Loader } from 'Components/l45-loader/l45-loader.component';


@Component({
  selector: "file-viewer",
  templateUrl: "./file-viewer.component.html",
  styleUrls: ["./file-viewer.component.scss"]
})
export class FileViewer {
  private logger: Logger = new Logger(this.constructor.name);

  /**
   * Max of lines contained in a chunk in the text area.
   * Chunks could easily deleted with all lines contained in
   * to avoid cycle every element to delete while scrolling.
   * This will avoid a noticeable performance decrease.
   */
  private readonly HTML_CHUNK_SIZE = 200; //lines

  private _contentList: Array<string> = [];
  private virtualRenderedTextArea: VirtualRenderedTextArea = new VirtualRenderedTextArea();

  private isEndLineRegex: RegExp = /^[\r\n]+$/g;
  private hasEndLineRegex: RegExp = /.+[\r\n]+$/g;

  private scrollTop: number = 0;
  private isAutoScrollDownEnabled: boolean = true;

  private _onGuessedLine: (number) => void = (guessedLine: number) => { }

  @ViewChild("textArea")
  private textArea: ElementRef;

  @ViewChild(MessagesBox)
  private messagesBox: MessagesBox;

  @ViewChild("contentWrapper")
  private contentWrapper: ElementRef;

  @ViewChild(L45Loader)
  private l45Loader: L45Loader;

  public showMessage(message: string) {
    this.clear();
    this.l45Loader.hideLoader();
    this.messagesBox.showMessage(message);
  }

  public closeMessage() {
    this.messagesBox.closeMessage();
  }

  public showLoader(): void {
    this.clear();
    this.messagesBox.closeMessage();
    this.l45Loader.showLoader();
  }

  public hideLoader(): void {
    this.l45Loader.hideLoader();
  }

  public writeText(content: Array<string>) {
    this.closeMessage();
    if (content && content.length > 0) {
      let html = this.convertChunkToHtml(content);
      var lineNumbersHtml = "";
      this.appendToHtml(html);
      this._contentList = this._contentList.concat(content);
      this.logger.debug("Sono state scritte %i righe", content.length);
      if (this.isAutoScrollDownEnabled) {
        this.virtualRenderedTextArea.getLastHtmlElement().render();
        this.scrollDown();
      }
    }
  }

  private appendToHtml(html: Array<any>) {
    $(this.textArea.nativeElement).append(html);
  }

  private handleScroll(event: any) {
    let elem = $(event.target);

    //Enable or disable auto-scroll
    if (event.target.scrollHeight - elem.scrollTop() <= elem.outerHeight() + 30) {
      //Is totally scrolled to bottom (with a tollerance of 30px)
      this.isAutoScrollDownEnabled = true;
      this.logger.debug("Auto scroll down enabled");
    } else if (event.target.scrollTop < this.scrollTop) {
      this.isAutoScrollDownEnabled = false;
      this.logger.debug("Auto scroll down disabled");
    }

    //Chunk-based calculations
    let guessedLine = this.guessTopLineNumber();
    this._onGuessedLine(guessedLine);
    let chunkN = this.getChunkIndex(guessedLine);
    let percentageOfScrollOnChunk = this.getPercentageOfScrollBasedOnChunks(guessedLine, chunkN);
    this.virtualRenderedTextArea.renderChunk(chunkN);
    if (percentageOfScrollOnChunk < 49) {
      this.logger.debug("i'm under 49 and i'm at chunk %s", chunkN);
      /* Se la percentuale di scroll stimata nel chunk corrente e minore del 49% devo renderizzare
         il chunk precedente */
      this.virtualRenderedTextArea.unrenderPrevChunks(chunkN - 1);
      this.virtualRenderedTextArea.renderPrevChunk(chunkN);
      this.virtualRenderedTextArea.unrenderNextChunks(chunkN);
    } else if (percentageOfScrollOnChunk > 80) {
      this.logger.debug("i'm over 90 and i'm at chunk %s", chunkN);
      this.virtualRenderedTextArea.unrenderPrevChunks(chunkN);
    } else if (percentageOfScrollOnChunk > 51) {
      this.logger.debug("i'm over 51 and i'm at chunk %s", chunkN);
      this.virtualRenderedTextArea.renderNextChunk(chunkN);
    }

    this.logger.debug("I guess i'm around line: %s", guessedLine);
    this.logger.debug("childs: %s", this.textArea.nativeElement.childNodes.length);
    this.scrollTop = event.target.scrollTop
  }

  private getPercentageOfScrollBasedOnChunks(guessedLine: number, chunkIndex: number): number {
    return (guessedLine - (this.HTML_CHUNK_SIZE * chunkIndex )) * 100 / this.HTML_CHUNK_SIZE;
  }

  private getChunkIndex(guessedLine: number): number {
    return Math.trunc(guessedLine / this.HTML_CHUNK_SIZE);
  }

  /**
   * Convert given lines into HTML specific for the text area.
   * Html elements are chunked in div to give the possibility of
   * easily delete them in group.
   * @param chunk of lines as strings.
   */
  private convertChunkToHtml(chunk: Array<string>): Array<Element> {
    let html: Array<Element> = [];
    let htmlPartial: string = "";
    let htmlChunk: VirtualHTMLChunkWrapper;
    let htmlChunckSize: number = 0;
    let isLastChunkNotPushed: boolean = true;

    if (!this.virtualRenderedTextArea.isHtmlEmpty()) {
      htmlChunk = this.virtualRenderedTextArea.getLastHtmlElement();
      htmlChunckSize = htmlChunk.nLines;
      isLastChunkNotPushed = false;
    } else {
      htmlChunk = new VirtualHTMLChunkWrapper();
      isLastChunkNotPushed = true;
    }

    let addBR: () => void = () => {
      htmlPartial += "<br>";
      if (htmlChunckSize < this.HTML_CHUNK_SIZE - 1) {
        htmlChunckSize++;
      } else {
        htmlChunk.append(htmlPartial);
        if(isLastChunkNotPushed) {
          html.push(htmlChunk.virtualHtmlEffective[0]);
          this.virtualRenderedTextArea.addHtmlElement(htmlChunk);
        }
        htmlChunk = new VirtualHTMLChunkWrapper();
        htmlChunckSize = 0;
        htmlPartial = "";
        isLastChunkNotPushed = true;
      }
    }

    chunk.forEach((e) => {
      if (this.isEndLine(e)) {
        addBR();
        return;
      }
      htmlPartial += "<span>" + e + "</span>";
      if (this.hasEndLine(e)) {
        addBR();
      }
    });

    if (htmlPartial) {
      htmlChunk.append(htmlPartial);
      if (isLastChunkNotPushed) {
        html.push(htmlChunk.virtualHtmlEffective[0]);
        this.virtualRenderedTextArea.addHtmlElement(htmlChunk);
      }
    }

    return html;
  }

  private hasEndLine(toCheck: string): boolean {
    this.hasEndLineRegex.lastIndex = 0;
    return this.hasEndLineRegex.test(toCheck);
  }

  private isEndLine(toCheck: string): boolean {
    let res: RegExpMatchArray = toCheck.match(this.isEndLineRegex);
    return res ? res[0] === toCheck : false;
  }

  public clear(): void {
    this.textArea.nativeElement.innerHTML = "";
    this._contentList = [];
    this.isAutoScrollDownEnabled = true;
    this.virtualRenderedTextArea = new VirtualRenderedTextArea();
  }

  private scrollDown(): void {
    let n = this.contentWrapper.nativeElement.scrollHeight;
    this.contentWrapper.nativeElement.scrollTop = n;
  }

  private guessTopLineNumber(): number {
    let height = this.contentWrapper.nativeElement.clientHeight;
    let lineHeight = parseInt(styleVar["line-height"]);
    let scrollUp = this.contentWrapper.nativeElement.scrollTop - this.contentWrapper.nativeElement.clientHeight;
    return Math.round(Math.abs((height + scrollUp) / lineHeight));
  }

  get contentList() {
    return this._contentList;
  }

  public onGuessedLine(callback: (guessedLine: number) => void): FileViewer {
    if (!callback) {
      callback = () => { };
    }
    this._onGuessedLine = callback;
    return this;
  }
}

/**
 * Represent the content written in the textArea and it's used
 * to delete elements the user cannot see with the purpose of improve
 * performance while inserting text
 */
class VirtualRenderedTextArea {
  public virtualHTMLInTextArea: Array<VirtualHTMLChunkWrapper> = [];
  public actuallyRenderedLineStart: number = 0;
  public actuallyRenderedLineEnd: number = 0;

  public addHtmlElement(html: HTMLElement | VirtualHTMLChunkWrapper) {
    if(html instanceof HTMLElement) {
      this.virtualHTMLInTextArea.push(new VirtualHTMLChunkWrapper(<HTMLElement> html));
    } else {
      this.virtualHTMLInTextArea.push(<VirtualHTMLChunkWrapper> html);
    }
  }

  /**
   * Return the last HTML element virtually added in textArea.
   * @return something like <div> ... <span>content</span><br> ... </div>
   */
  public getLastHtmlElement(): VirtualHTMLChunkWrapper {
    if (this.isHtmlEmpty()) {
      return null;
    }
    return this.virtualHTMLInTextArea[this.virtualHTMLInTextArea.length - 1];
  }

  public isHtmlEmpty(): boolean {
    if (this.virtualHTMLInTextArea.length === 0) {
      return true;
    }
    return false;
  }

  public unrenderPrevChunks(chunkIndex: number) {
    if (chunkIndex == null || chunkIndex <= 1 || chunkIndex >= this.virtualHTMLInTextArea.length) {
      return;
    }
    this.virtualHTMLInTextArea.slice(0, chunkIndex).forEach((e) => {
      e.unrender();
    });
  }

  public renderNextChunk(chunkIndex: number) {
    if (chunkIndex == null || chunkIndex < 0 || chunkIndex >= this.virtualHTMLInTextArea.length - 1) {
      return;
    }
    let nextIndex = chunkIndex + 1;
    this.virtualHTMLInTextArea[nextIndex].render();
  }

  public renderPrevChunk(chunkIndex: number) {
    if (chunkIndex == null || chunkIndex <= 1 || chunkIndex >= this.virtualHTMLInTextArea.length) {
      return;
    }
    let prevIndex = chunkIndex - 1;
    this.virtualHTMLInTextArea[prevIndex].render();
  }

  public unrenderNextChunks(chunkIndex: number) {
    if (chunkIndex == null || chunkIndex < 0 || chunkIndex >= this.virtualHTMLInTextArea.length - 1) {
      return;
    }
    let nextIndex = chunkIndex + 1;
    this.virtualHTMLInTextArea.slice(nextIndex, this.virtualHTMLInTextArea.length).forEach((e) => {
      e.unrender();
    });
  }

  public renderChunk(chunkIndex: number) {
    if (chunkIndex == null || chunkIndex < 0 || chunkIndex >= this.virtualHTMLInTextArea.length) {
      return;
    }
    this.virtualHTMLInTextArea[chunkIndex].render();
  }

}

/**
 * Wrapper that permit operations on chunk of Html elements virtually
 * added to the text area
 */
class VirtualHTMLChunkWrapper {
  public virtualHtml: JQuery;
  public nLines: number = 0;
  public virtualHtmlEffective: JQuery = $(document.createElement("div"));
  public isRendered: boolean = true;

  constructor(virtualHtml: HTMLElement = document.createElement("div")) {
    this.virtualHtml = $(virtualHtml);
    this.nLines = this.countBreakLines();
    //Call unrender to initializa as blank the effective html
    this.virtualHtmlEffective = this.unrender();
  }

  public append(html: string): void {
    this.virtualHtml.append(html);
    this.nLines = this.countBreakLines();
    if (this.isRendered) {
      this.virtualHtmlEffective.append(html);
    } else {
      this.virtualHtmlEffective.css("height", this.getHeightFromLine());
    }
  }

  public render(): JQuery {
    if (this.isRendered) {
      return this.virtualHtmlEffective;
    }
    this.virtualHtmlEffective.html("");
    this.virtualHtmlEffective.css("height", "");
    this.virtualHtmlEffective.append(this.virtualHtml.clone().children());
    this.isRendered = true;
    return this.virtualHtmlEffective;
  }

  public unrender(): JQuery {
    if (!this.isRendered) {
      return this.virtualHtmlEffective;
    }
    this.virtualHtmlEffective.html("");
    this.virtualHtmlEffective.css("height", this.getHeightFromLine());
    this.isRendered = false;
    return this.virtualHtmlEffective;
  }

  private getHeightFromLine(): string {
    return (parseInt(styleVar["line-height"]) * this.nLines) + "px";
  }

  private countBreakLines(): number {
    let count: number = 0;
    $(this.virtualHtml).children().each((index: number, elem: Element) => {
      if (elem.tagName.toLowerCase() === "br") {
        count++;
      }
    });
    return count;
  }

}