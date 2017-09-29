import { NgModule }      from '@angular/core';
import { HttpModule } from '@angular/http';
import { BrowserModule } from '@angular/platform-browser';
import { PictureGallery, PictureThumbnail, PictureGroupView }  from './ui/pictureGallery.component';
import { PictureMetadataService } from './service/picturesMetadata.service'
import { MediaserverApp } from './ui/mediaserverApp.component'

import { LazyLoadImageModule } from 'ng2-lazyload-image';

import { NotificationService } from './ui/notificationService';

import { PictureModal } from './ui/pictureModal/pictureModal.component';
import { UploadModal, ImageUploadPreview } from './ui/uploadModal.component';
//import { SimpleNotificationsModule } from 'angular2-notifications';
// https://jaspero.co/resources/projects/ng-notifications
// yarn add angular2-notifications

const noticationsEl = document.createElement("div");
document.body.appendChild(noticationsEl);

@NgModule({
	imports: [BrowserModule, HttpModule, LazyLoadImageModule],
	//	imports: [BrowserModule, HttpModule, LazyLoadImageModule, SimpleNotificationsModule.forRoot()],
	declarations: [PictureGallery, PictureThumbnail, PictureGroupView, PictureModal, MediaserverApp, UploadModal, ImageUploadPreview],
  bootstrap: [MediaserverApp],
  providers: [PictureMetadataService, NotificationService, PictureModal, { provide: 'Window', useValue: window }, { provide: 'NotificationsElement', useValue: noticationsEl }]
})
export class AppModule { }
