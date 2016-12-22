import { Component, OnInit } from '@angular/core';
import { PictureMetadataService } from './picturesMetadata.service'
import { PictureMetadata } from './pictureMetadata'

@Component({
    selector: 'my-app',
    template: `<h1>Hello</h1>
        <div *ngFor="let pictureMetadata of pictureMetadatas">
            <div class="thumbnail"><img src="/picture/{{ pictureMetadata.hashValue }}?h=200"></div>
        </div>
      `,
    styles: [`
        .thumbnail {
            float: left;
        }
    `],
    providers: [PictureMetadataService]
})
export class PictureGallery implements OnInit {
    pictureMetadatas: PictureMetadata[]
    constructor(private pictureMetadataService: PictureMetadataService) {
        console.log("constructor")

    }
    ngOnInit() {
        this.pictureMetadataService.fetch().subscribe(
            picturesMetadata => this.pictureMetadatas = picturesMetadata,
            error => console.log(error))
    }
}
