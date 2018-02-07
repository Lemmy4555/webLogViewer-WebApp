declare var __APIROOT__: string;
declare var __APICONTEXT__: string;
declare var __USECACHEDB__: boolean;

export class CommonConstants {
  private static readonly API_ROOT: string = __APIROOT__;
  public static readonly API_HOME: string = __APIROOT__ + "/" + __APICONTEXT__ + "/api/";
  public static readonly DB_NAME = "webLogViewerDB";
  public static readonly UNREACHABLE_ERR = "Non e stata reperita alcuna risposta dalle API";
  public static readonly USE_CACHE_DB = __USECACHEDB__;
  public static readonly UNVALID_PATH = "../void";
}