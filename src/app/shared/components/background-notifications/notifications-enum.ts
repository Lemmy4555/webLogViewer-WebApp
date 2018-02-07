class NotificationsCode {
  public static readonly FILE: NotificationsCode = new NotificationsCode("FILE");
  public static readonly DB: NotificationsCode = new NotificationsCode("DB");
  public static readonly OK: NotificationsCode = new NotificationsCode("OK");
  public static readonly DOWNLOAD: NotificationsCode = new NotificationsCode("DOWNLOAD");
  public static readonly SYNC: NotificationsCode = new NotificationsCode("SYNC");
  public static readonly WRITE: NotificationsCode = new NotificationsCode("WRITE");

  public value: string;

  constructor(code: string) {
    this.value = code;
  }
}

export class Notifications {
  public static readonly FILE: Notifications = new Notifications(NotificationsCode.FILE);
  public static readonly DB: Notifications = new Notifications(NotificationsCode.DB);
  public static readonly OK: Notifications = new Notifications(NotificationsCode.OK);
  public static readonly DOWNLOAD: Notifications = new Notifications(NotificationsCode.DOWNLOAD);
  public static readonly SYNC: Notifications = new Notifications(NotificationsCode.SYNC);
  public static readonly WRITE: Notifications = new Notifications(NotificationsCode.WRITE);

  public code: string;

  constructor(code: NotificationsCode) {
    this.code = code.value;
  }

}

