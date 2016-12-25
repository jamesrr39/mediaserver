import { Component, OnInit, Input } from '@angular/core';
import { PictureMetadataService } from './picturesMetadata.service'
import { PictureMetadata } from './pictureMetadata'
import { PictureGroup } from './pictureGroup';
import { PicturesByDate } from './picturesByDate';


@Component({
    selector: 'my-app',
    template: `
        <div *ngFor="let pictureGroup of pictureGroups">
            <picture-group [pictureGroup]="pictureGroup"></picture-group>
        </div>
      `,
    providers: [PictureMetadataService]
})
export class PictureGallery implements OnInit {
    pictureGroups: PictureGroup[]
    constructor(private pictureMetadataService: PictureMetadataService) {}
    ngOnInit() {
        var self = this;
        
        this.pictureMetadataService.fetch().subscribe(
            (picturesMetadata) => {
                self.pictureGroups = (new PicturesByDate(picturesMetadata)).pictureGroups()
            },
            error => console.log(error))
    }
}

@Component({
    selector: 'picture-group',
    template: `
    <div class="row">
        <h3>{{ groupDisplayString }}</h3>
        <div class="thumbnail-container" *ngFor="let pictureMetadata of picturesMetadatas">
                <picture-thumbnail [pictureMetadata]="pictureMetadata"></picture-thumbnail>
        </div>
    </div>`,
    styles: [`
        .thumbnail-container {
            float: left;
        }
    `]
})
export class PictureGroupView {
    @Input() pictureGroup: PictureGroup
    groupDisplayString: string
    picturesMetadatas: PictureMetadata[]
    ngOnInit() {
        this.groupDisplayString = this.pictureGroup.groupName()
        this.picturesMetadatas = this.pictureGroup.pictureMetadatas()
    }
    
}

@Component({
    selector: 'picture-thumbnail',
    template: `
        <img [src]="defaultImage" [lazyLoad]="image" [offset]="offset">
    `,
    styles: [`
        img {
            width: 300px;
            height: 200px;
        }
    `]
})
export class PictureThumbnail {
    @Input() pictureMetadata: PictureMetadata;
    defaultImage = '/a/b.jpg';
    image = '/picture/{{pictureMetadata.hashValue}}?h=200';
    offset = 100;
    
}