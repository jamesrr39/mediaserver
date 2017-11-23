import { Component, ViewChild, Inject } from '@angular/core';
import { UploadModal } from './uploadModal.component';
import { PictureMetadataService } from '../service/picturesMetadata.service';
import { NotificationService } from '../service/notificationService';

import { PictureMetadata } from '../domain/pictureMetadata';

@Component({
    selector: "mediaserver-app",
    template: `
    <div class="container">
      <div class="row header-toolbar">
        <div class="col-xs-12">
          <nav>
            <button class="btn btn-default">
              Refresh
            </button>
            <button (click)="openUploadModal()"
              (mouseover)="$event.target.classList.add('hover-active')"
              (mouseout)="$event.target.classList.remove('hover-active')"
               class="btn btn-default">
                <i class="glyphicon glyphicon-upload"></i>
                Upload
              </button>

              <input
                type="text"
                (keyup)="onSearchInputKeyup($event)"
                placeholder="Search..."
                class="form-control" />
          </nav>
        </div>
      </div>
      <div *ngIf="loaded">
        <picture-gallery [picturesMetadata]="picturesMetadata">Loading AppComponent content here ...</picture-gallery>
      </div>
    </div>

    <upload-modal [notificationService]="notificationService"></upload-modal>
    <notification-service></notification-service>
    `
})
export class MediaserverApp {
  	@ViewChild(UploadModal)
  	public readonly uploadModal: UploadModal;

    @ViewChild(NotificationService)
    public readonly notificationService: NotificationService;

    picturesMetadata: PictureMetadata[];

    private loaded = false;

    constructor(
      private pictureMetadataService: PictureMetadataService) {}

    ngOnInit() {
          this.pictureMetadataService.fetch().subscribe(
  			(picturesMetadata) => {
          this.picturesMetadata = picturesMetadata;
          this.loaded = true;
  			}, err => {throw err});
  	}

    openUploadModal() {
      this.uploadModal.show();
    }

    onSearchInputKeyup(event: KeyboardEvent) {
      const searchTerm = (event.currentTarget as HTMLInputElement).value;
      console.log("searched for "+searchTerm)
    }
}
