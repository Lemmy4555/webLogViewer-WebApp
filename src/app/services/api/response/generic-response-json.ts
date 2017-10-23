export interface GenericResponse {
  responseText: string;
  status: number;
  errorCode: number;
  ok: boolean;
  statusText: string;
  json: () => any;
}