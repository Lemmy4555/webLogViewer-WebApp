import { Component } from "@angular/core";

import { Notifications } from './notifications-enum';

import { Logger } from "Logger/logger";

@Component({
  selector: "background-notifications",
  templateUrl: "./background-notifications.component.html",
  styleUrls: ["./background-notifications.component.css"]
})
export class BackgroundNotifications {
  private logger: Logger = new Logger(this.constructor.name)
  private readonly NOTIFICATIONS_CODES: any = Notifications;
  private notificationsToShow: Array<Notifications> = [];

  private logShow(notification: Notifications) {
    this.logger.debug("%s notification as beed showed %o", notification.code, this.notificationsToShow);
  }

  private logHide(notification: Notifications) {
    this.logger.debug("%s notification as beed hided %o", notification.code, this.notificationsToShow);
  }

  public showOkNotification(): void {
    /*
    * OK notification must be at the first position and eventually
    * must take the position of WRITE notification.
    */
    this.insert(Notifications.OK).atThePositionOf(Notifications.WRITE)
      .elseAtTheBeginingOfArray();
  }

  public hideOkNotification(): void {
    this.hideNotification(Notifications.OK);
  }

  public showWriteNotification(): void {
    /*
    * WRITE notification must be at the first position and eventually
    * must take the position of OK notification.
    */
    this.insert(Notifications.WRITE).atThePositionOf(Notifications.OK)
      .elseAtTheBeginingOfArray();
  }

  public hideWriteNotification(): void {
    this.hideNotification(Notifications.WRITE);
  }

  public showDownloadNotification(): void {
    /*
    * Download notification must be at after OK or WRITE notification.
    */
    this.insert(Notifications.DOWNLOAD).after(Notifications.WRITE)
      .elseAfter(Notifications.OK)
      .elseAtTheBeginingOfArray();
  }

  public hideDownloadNotification(): void {
    this.hideNotification(Notifications.DOWNLOAD);
  }

  public showFileNotification(): void {
    /*
    * FILE notification must be at after SYNC notification
    * or after DOWNLOAD or after OK or WRITE notification.
    */
    this.insert(Notifications.FILE).after(Notifications.SYNC)
      .elseAfter(Notifications.DOWNLOAD)
      .elseAfter(Notifications.OK).elseAfter(Notifications.WRITE)
      .elseAtTheBeginingOfArray();
  }

  public hideFileNotification(): void {
    this.hideNotification(Notifications.FILE);
  }

  public showSyncNotification(): void {
    /*
    * SYNC notification must be at after FILE  OK or WRITE notification.
    */
    this.insert(Notifications.SYNC).after(Notifications.DOWNLOAD)
      .elseAfter(Notifications.OK).elseAfter(Notifications.WRITE)
      .elseAtTheBeginingOfArray();
  }

  public hideSyncNotification(): void {
    this.hideNotification(Notifications.SYNC);
  }

  private hideNotification(notification: Notifications): void {
    let index = this.notificationsToShow.indexOf(notification);
    if (index >= 0) {
      this.notificationsToShow.splice(index, 1);
    }

    this.logHide(notification);
  }

  /**
   * Insert a notification in the notifications to show array
   * @param notification 
   */
  private insert(notification: Notifications): LambdaNotificationsInsert {
    let index = this.notificationsToShow.indexOf(notification);
    if (index === -1) {
      return new LambdaNotificationsInsert(this.notificationsToShow, notification, true, () => this.logShow(notification));
    }

    return new LambdaNotificationsInsert(this.notificationsToShow, notification, false);
  }

}

class LambdaNotificationsInsert {
  private notificationsToShow: NotificationsArrayHelper;
  private toInsert: Notifications;
  private freeToGo: boolean;
  private onDone: () => void = () => { };

  constructor(notificationsToShow: Array<Notifications>, toInsert: Notifications, freeToGo: boolean, onDone?: () => void) {
    this.notificationsToShow = new NotificationsArrayHelper(notificationsToShow);
    this.toInsert = toInsert;
    this.freeToGo = freeToGo;
    this.onDone = onDone;
  }

  /**
   * Insert the subject notification after the notification in input
   * @param notification 
   */
  public after(notification: Notifications): LambdaNotificationsElse {
    if (!this.freeToGo) {
      return new LambdaNotificationsElse(this.notificationsToShow, this.toInsert, false, this.onDone);
    }

    let index = this.notificationsToShow.array.indexOf(notification);
    if (index >= 0) {
      this.notificationsToShow.insertAfter(index, this.toInsert);
      this.onDone();
    } else {
      return new LambdaNotificationsElse(this.notificationsToShow, this.toInsert, true, this.onDone);
    }

    return new LambdaNotificationsElse(this.notificationsToShow, this.toInsert, false, this.onDone);
  }

  /**
   * Insert the subject notification at the position notification in input
   * @param notification 
   */
  public atThePositionOf(notification: Notifications): LambdaNotificationsElse {
    if (!this.freeToGo) {
      return new LambdaNotificationsElse(this.notificationsToShow, this.toInsert, false, this.onDone);
    }

    let index = this.notificationsToShow.array.indexOf(notification);
    if (index >= 0) {
      this.notificationsToShow.array[index] = this.toInsert;
      this.onDone();
    } else {
      return new LambdaNotificationsElse(this.notificationsToShow, this.toInsert, true, this.onDone);
    }

    return new LambdaNotificationsElse(this.notificationsToShow, this.toInsert, false, this.onDone);
  }
}

class LambdaNotificationsElse {
  private notificationsToShow: NotificationsArrayHelper;
  private toInsert: Notifications;
  private freeToGo: boolean;
  private onDone: () => void = () => { };

  constructor(notificationsToShow: NotificationsArrayHelper, toInsert: Notifications, freeToGo: boolean, onDone: () => void) {
    this.notificationsToShow = notificationsToShow;
    this.toInsert = toInsert;
    this.freeToGo = freeToGo;
    this.onDone = onDone;
  }

  /**
   * Else insert it after the notification in input
   * @param notification
   */
  public elseAfter(notification: Notifications): LambdaNotificationsElse {
    if (!this.freeToGo) {
      return new LambdaNotificationsElse(this.notificationsToShow, this.toInsert, false, this.onDone);
    }

    let index = this.notificationsToShow.array.indexOf(notification);
    if (index >= 0) {
      this.notificationsToShow.insertAfter(index, this.toInsert);
      this.onDone();
    } else {
      return new LambdaNotificationsElse(this.notificationsToShow, this.toInsert, true, this.onDone);
    }

    return new LambdaNotificationsElse(this.notificationsToShow, this.toInsert, false, this.onDone);
  }

  /**
   * Else insert it as the first element of the array
   */
  public elseAtTheBeginingOfArray(): void {
    if (!this.freeToGo) {
      return;
    }

    this.notificationsToShow.array.unshift(this.toInsert);
    this.onDone();
  }
}

class NotificationsArrayHelper {
  public array: Array<Notifications>;

  constructor(array: Array<Notifications>) {
    this.array = array;
  }

  public insertAfter(index: number, notification: Notifications): void {
    if (index >= this.array.length - 1) {
      this.array.push(notification);
    } else {
      this.array.splice(index + 1, 0, notification);
    }
  }
}
