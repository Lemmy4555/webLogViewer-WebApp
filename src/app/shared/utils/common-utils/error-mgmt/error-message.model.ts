import { ErrorMessageInterface } from './error-message.interface';

export class ErrorMessageModel implements ErrorMessageInterface {
  public std: string;
  public html: string;

  constructor(std: string, html: string) {
    this.std = std;
    this.html = html;
  }
}