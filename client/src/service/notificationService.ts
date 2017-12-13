import { Component, NgZone, ViewChild } from '@angular/core';

@Component({
	selector: "notification-service",
	template: `
			<div class="notification alert alert-{{notification.level}}" *ngFor="let notification of notifications">
				{{ notification.message }} <span class="glyphicon glyphicon-remove" (click)="removeNotification(notification)"></span>
			</div>
	`,
	styles: [`
		:host {
			position: fixed;
			top: 20px;
			right: 20px;
		}
	`]
})
export class NotificationService {

	notifications: Notification[] = [];

	success(message: string) {
		const notification = new Notification("success", message);
		this.notifications.push(notification);
		setTimeout(() => {
			this.notifications.splice(this.notifications.indexOf(notification), 1)
		}, 4000);
	}

	error(message: string) {
		const notification = new Notification("danger", message);
		this.notifications.push(notification);
	}

	private removeNotification(notification: Notification) {
		const index = this.notifications.indexOf(notification);
		this.notifications.splice(index, 1);
	}
}

class Notification {
	constructor(
		public readonly level: string,
		public readonly message: string
	){}
}
