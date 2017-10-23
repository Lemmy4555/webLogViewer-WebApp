import { ErrorMessage } from './error-message';

export class ErrorMessageModel implements ErrorMessage {
  public std: string;
  public html: string;

  constructor(std: string, html: string) {
    this.std = std;
    this.html = html;
  }
}