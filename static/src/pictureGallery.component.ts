import { Component, OnInit, Input } from '@angular/core';
import { PictureMetadataService } from './picturesMetadata.service'
import { PictureMetadata } from './pictureMetadata'
import { PictureGroup } from './pictureGroup';
import { PicturesByDate } from './picturesByDate';


@Component({
    selector: 'picture-gallery',
    template: `
        <div class="widget-container">
		<form method="POST" action="/pictures/">
			<input type="file" name="file" multiple="true" (change)="upload($event)">
		</form>
            <div *ngFor="let pictureGroup of pictureGroups">
                <picture-group [pictureGroup]="pictureGroup"></picture-group>
            </div>
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
	upload(event: FileListTarget){
            let fileList = event.target.files;
            console.log("any event")
            for (let i = 0; i < fileList.length; i++){
                this.pictureMetadataService.upload(fileList[i]).subscribe();
            }
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
        <div class="">
            <div class="row col-sm-12">
                <h3>{{ groupDisplayString }}</h3>
                <div class="thumbnail-container" *ngFor="let pictureMetadata of picturesMetadatas">
                        <picture-thumbnail [pictureMetadata]="pictureMetadata"></picture-thumbnail>
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
        <img [src]="defaultImage" [lazyLoad]=pictureSrc [offset]="offset">
    `,
    styles: [`
        img {
            height: 200px;
        }
    `]
})
export class PictureThumbnail {
    @Input() pictureMetadata: PictureMetadata;
    defaultImage = '/a/b.jpg';
    pictureSrc: string
    offset = 100;
    ngOnInit(){
        this.pictureSrc = "/picture/" + this.pictureMetadata.hashValue + "?h=200"
    }
    
}