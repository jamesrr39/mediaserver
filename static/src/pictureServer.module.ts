import { NgModule }      from '@angular/core';
import { HttpModule } from '@angular/http';
import { BrowserModule } from '@angular/platform-browser';
import { PictureGallery }  from './pictureGallery.component';
import { PictureMetadataService } from './picturesMetadata.service'


@NgModule({
  imports:      [ BrowserModule, HttpModule ],
  declarations: [PictureGallery ],
  bootstrap: [PictureGallery],
  providers: [PictureMetadataService]
})
export class AppModule { }
