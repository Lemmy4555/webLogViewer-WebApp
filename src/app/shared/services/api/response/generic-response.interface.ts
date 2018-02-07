export interface GenericResponseInterface {
  responseText: string;
  status: number;
  errorCode: number;
  ok: boolean;
  statusText: string;
  headers: Headers;
  json: () => any;
}