import { NgModule }      from '@angular/core';
import { HttpModule } from '@angular/http';
import { BrowserModule } from '@angular/platform-browser';
import { PictureGallery, PictureThumbnail, PictureGroupView }  from './pictureGallery.component';
import { PictureMetadataService } from './picturesMetadata.service'

import { LazyLoadImageModule } from 'ng2-lazyload-image';

import { ModalModule } from 'angular2-modal';
import { BootstrapModalModule } from 'angular2-modal/plugins/bootstrap';

@NgModule({
    imports: [BrowserModule, HttpModule, LazyLoadImageModule, ModalModule.forRoot(), BootstrapModalModule ],
  declarations: [PictureGallery, PictureThumbnail, PictureGroupView ],
  bootstrap: [PictureGallery],
  providers: [PictureMetadataService]
})
export class AppModule { }
