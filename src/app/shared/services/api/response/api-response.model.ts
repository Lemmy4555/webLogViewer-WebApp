export class ApiResponseModel<T> {
  private _status: number;
  private _response: T;
  private _eTag: string;

  constructor(response: T, status: number, eTag: string) {
    this._response = response;
    this._status = status;
    this._eTag = eTag;
  }

  get status() {
    return this._status;
  }

  get response() {
    return this._response;
  }

  get eTag() {
    return this._eTag;
  }
}