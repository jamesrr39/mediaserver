import { NgModule }      from '@angular/core';
import { HttpModule } from '@angular/http';
import { BrowserModule } from '@angular/platform-browser';
import { PictureGallery, PictureGroupView }  from './ui/pictureGallery.component';
//import { PictureGroupView } from './ui/pictureGroup';
import { PictureThumbnail } from './ui/pictureThumbnail.component';
import { PictureMetadataService } from './service/picturesMetadata.service'
import { MediaserverApp } from './ui/mediaserverApp.component'

import { LazyLoadImageModule } from 'ng2-lazyload-image';

import { NotificationService } from './service/notificationService';

import { PictureModal } from './ui/pictureModal/pictureModal.component';
import { UploadModal, ImageUploadPreview } from './ui/uploadModal.component';
//import { SimpleNotificationsModule } from 'angular2-notifications';
// https://jaspero.co/resources/projects/ng-notifications
// yarn add angular2-notifications

import { Observable } from 'rxjs';

const debouncedScrollObservable = Observable.fromEvent(window, "scroll").debounceTime(150);

@NgModule({
	imports: [BrowserModule, HttpModule, LazyLoadImageModule],
	//	imports: [BrowserModule, HttpModule, LazyLoadImageModule, SimpleNotificationsModule.forRoot()],
	declarations: [
		PictureGallery,
		PictureThumbnail,
		PictureGroupView,
		PictureModal,
		MediaserverApp,
		UploadModal,
		ImageUploadPreview,
		NotificationService
	],
  bootstrap: [MediaserverApp],
  providers: [
		PictureMetadataService,
		PictureModal,
		{ provide: 'Window', useValue: window },
		{ provide: "debouncedScrollObservable", useValue: debouncedScrollObservable}
	]
})
export class AppModule { }
