import { Injectable, Inject, ElementRef, Component, AfterContentInit } from '@angular/core';
import { SafeHtml } from '@angular/platform-browser';

@Component({
	selector: "app-root",
	template: `
		<div class="notification-service"></div>
	`
})
@Injectable()
export class NotificationService implements AfterContentInit {
	constructor() {
		console.log("notification service constructor")


	}
	info(message: string) {

		console.log(message)
	}
	ngAfterContentInit() { }

}
