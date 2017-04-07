import { Component, OnInit, Input, ViewContainerRef } from '@angular/core';
import { PictureMetadataService } from './picturesMetadata.service'
import { PictureMetadata } from './pictureMetadata'
import { PictureGroup } from './pictureGroup';
import { PicturesByDate } from './picturesByDate';

import { PictureModal } from './pictureModal.directive';

@Component({
    selector: 'picture-gallery',
    template: `
        <div class="widget-container">
            <form method="POST" action="/pictures/">
                <input type="file" name="file" multiple="true" (change)="upload($event)">
            </form>
            <div *ngFor="let pictureGroup of pictureGroups">
                <picture-group [pictureGroup]="pictureGroup" [pictureModal]="pictureModal"></picture-group>
            </div>
        </div>
      `,
    providers: [PictureMetadataService, PictureModal]
})
export class PictureGallery implements OnInit {
    pictureGroups: PictureGroup[]
    private picturesMetadata: PictureMetadata[] = []
    constructor(private pictureMetadataService: PictureMetadataService, public pictureModal: PictureModal) {}
    ngOnInit() {
        var self = this;

        this.pictureMetadataService.fetch().subscribe(
            (picturesMetadata) => {
                self.picturesMetadata = picturesMetadata;
                self.updateRendering()
            },
            error => console.log(error))
    }
    upload(event: FileListTarget){
        var self = this;

        let fileList = event.target.files;
        for (let i = 0; i < fileList.length; i++){
            this.pictureMetadataService.upload(fileList[i]).subscribe(pictureMetadata => {
                self.picturesMetadata.push(pictureMetadata);
                self.updateRendering()
            });
        }
    }
    updateRendering() {
        this.pictureGroups = (new PicturesByDate(this.picturesMetadata)).pictureGroups()
    }
}

class FileListTarget {
    target: {
        files: FileList
    }
}

@Component({
    selector: 'picture-group',
    template: `
        <div>
            <div class="row col-sm-12">
                <h3>{{ groupDisplayString }}</h3>
                <div class="thumbnail-container" *ngFor="let pictureMetadata of picturesMetadatas">
                    <picture-thumbnail [pictureMetadata]="pictureMetadata" [pictureModal]="pictureModal"></picture-thumbnail>
                </div>
            </div>
        </div>`,
    styles: [`
        .thumbnail-container {
            float: left;
        }
        .row{
            margin: 25px 0;
        }
      `]
})
export class PictureGroupView {
    @Input() pictureGroup: PictureGroup
    @Input() pictureModal: PictureModal
    groupDisplayString: string
    picturesMetadatas: PictureMetadata[]
    constructor() {}
    ngOnInit() {
        this.groupDisplayString = this.pictureGroup.groupName()
        this.picturesMetadatas = this.pictureGroup.pictureMetadatas()
    }
    
}

@Component({
    selector: 'picture-thumbnail',
    template: `
        <img [src]="defaultImage" [lazyLoad]=pictureSrc [offset]="offset" (click)="openModal()">
    `,
    styles: [`
        img {
            height: 200px;
        }
        :host {
            padding: 0 5px 5px 0;
            margin: 0 0 5px 0;
            overflow: auto;
        }
    `]
})
export class PictureThumbnail {
    @Input() pictureMetadata: PictureMetadata;
    @Input() pictureModal: PictureModal
    defaultImage = '/a/b.jpg';
    pictureSrc: string
    offset = 100;
    ngOnInit(){
        this.pictureSrc = "/picture/" + this.pictureMetadata.hashValue + "?h=200"
    }
    openModal() {
        
        this.pictureModal.open(this.pictureMetadata)
        
//        this.modal.alert()
//            .size('lg')
//            .isBlocking(true)
//            .showClose(true)
//            .keyboard(27)
//            .title('Hello World')
//            .body('<img src="/picture/' + this.pictureMetadata.hashValue + '?h=800">')
//            .open();
        /*
        this.modal.open(`
        <h1>opened modal</h1>
        `, {
          
        })*/
    }
    
}