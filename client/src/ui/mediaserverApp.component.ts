import { Component, ViewChild, Inject, ElementRef } from '@angular/core';
import { UploadModal } from './uploadModal.component';
import { PictureMetadataService } from '../service/picturesMetadata.service';
import { NotificationService } from '../service/notificationService';

import { PictureMetadata } from '../domain/pictureMetadata';
import { PictureGallery } from './pictureGallery.component';
import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs';


@Component({
    selector: 'mediaserver-app',
    template: `
    <div class="container-fluid">
      <div class="row header-toolbar">
        <div class="col-xs-12">
          <nav>
            <button (click)="refresh()" class="btn btn-default">
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
                placeholder="Search..."
                class="form-control"
                #searchInput />
          </nav>
        </div>
      </div>
      <picture-gallery [picturesMetadata]="picturesMetadata">Loading AppComponent content here ...</picture-gallery>
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

    @ViewChild(PictureGallery)
    public readonly pictureGallery: PictureGallery;

    @ViewChild("searchInput")
    private readonly searchInput: ElementRef;

    private searchInputSubscription: Subscription;

    picturesMetadata: PictureMetadata[] = [];

    constructor(
      private pictureMetadataService: PictureMetadataService) {}

    ngAfterViewInit() {
      this.fetch(false);

      this.searchInputSubscription = Observable.fromEvent(this.searchInput.nativeElement, "keyup")
        .debounceTime(150)
        .subscribe((event: KeyboardEvent) => {
          console.log((event.target as HTMLInputElement).value);
        });
    }

    fetch(shouldRefresh: boolean): Observable<PictureMetadata[]> {
      const observable = this.pictureMetadataService.fetch(shouldRefresh);
      observable.subscribe(
        (picturesMetadata) => {
          this.picturesMetadata = picturesMetadata;
          this.pictureGallery.setPicturesMetadatas(picturesMetadata);
        }, err => {
          this.notificationService.error("Gallery fetch failed. Error: " + err)
        });
        return observable;
    }

    refresh() {
      this.fetch(true).subscribe(() => {
        this.notificationService.success("Gallery successfully refreshed");
      })
    }

    ngOnDestroy() {
      this.searchInputSubscription.unsubscribe();
    }

    openUploadModal() {
      this.uploadModal.show();
    }
}
