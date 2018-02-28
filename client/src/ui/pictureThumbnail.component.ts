import {Component, Input, Inject, ElementRef, ViewChild} from '@angular/core';
import {Observable} from 'rxjs';

import {PictureMetadata} from '../domain/pictureMetadata';
import {PictureModal} from './pictureModal/pictureModal.component';

@Component({
    selector: 'picture-thumbnail',
    template: `
        <img #imageRef
          class="not-loaded"
          [lazyLoad]=pictureSrc
          [offset]="offset"
          [scrollObservable]="debouncedScrollObservable"
          (click)="openModal()"
          (load)="onLoadImage($event)">
    `,
    styles: [`
        .not-loaded {
          width: 200px;
          height: 200px;
          background-color: #bbb;
        }
        img {
            max-height: 200px;
        }
        :host {
            padding: 0 5px 5px 0;
            margin: 0 0 5px 0;
            overflow: auto;
			      display: inline-block;
        }
    `]
})
export class PictureThumbnail {
    @Input() pictureMetadata: PictureMetadata;
    @Input() pictureModal: PictureModal;

    @ViewChild("imageRef")
    imageRef: ElementRef;

    pictureSrc: string
    offset = 50;
    constructor(
      @Inject("debouncedScrollObservable")
      private debouncedScrollObservable: Observable<Event>){}

    ngOnInit(){
        this.pictureSrc = "/picture/" + this.pictureMetadata.hashValue + "?h=200";
    }
    openModal() {
		  this.pictureModal.show(this.pictureMetadata);
    }
    onLoadImage() {
      this.imageRef.nativeElement.classList.remove("not-loaded");
    }

}
