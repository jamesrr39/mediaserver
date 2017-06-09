import { Component, OnInit, Input, ViewChild } from '@angular/core';
import { PictureMetadataService } from './picturesMetadata.service'
import { PictureMetadata } from './pictureMetadata'
import { PictureGroup, PictureGroupHelper } from './pictureGroup';
import { PicturesByDate } from './picturesByDate';

import { PictureModal } from './pictureModal/pictureModal.component';

@Component({
    selector: 'picture-gallery',
    template: `
        <div class="widget-container">
            <form method="POST" action="/pictures/">
                <input type="file" class="btn btn-primary" name="file" multiple="true" (change)="upload($event)">
            </form>
            <div *ngFor="let pictureGroup of pictureGroups">
                <picture-group [pictureGroup]="pictureGroup" [pictureModal]="pictureModal"></picture-group>
            </div>
        </div>

		<picture-modal>
			<div class="modal-text">ABC in modal</div>
			<div class="app-modal-header">
			header
		</div>
		<div class="app-modal-body">
		  Whatever content you like, form fields, anything
		</div>
		<div class="app-modal-footer">
		  <button type="button" class="btn btn-default" (click)="pictureModal.hide()">Close</button>
		  <button type="button" class="btn btn-primary">Save changes</button>
		</div>
		</picture-modal>
      `,
    providers: [PictureMetadataService]
})
export class PictureGallery implements OnInit {
    pictureGroups: PictureGroup[]
	private picturesMetadata: PictureMetadata[] = []

	@ViewChild(PictureModal)
	public readonly pictureModal: PictureModal;

	constructor(private pictureMetadataService: PictureMetadataService) {
	}
    ngOnInit() {
        this.pictureMetadataService.fetch().subscribe(
            (picturesMetadata) => {
                this.picturesMetadata = picturesMetadata;
                this.updateRendering()
            },
            error => console.log(error))
    }
    upload(event: FileListTarget){
		const pictureGallery = this;

		const fileList = event.target.files;
        for (let i = 0; i < fileList.length; i++){
            this.pictureMetadataService.upload(fileList[i]).subscribe(pictureMetadata => {
				pictureGallery.picturesMetadata.push(pictureMetadata);
				pictureGallery.updateRendering();
			});
        }
    }
    updateRendering() {
        this.pictureGroups = (new PicturesByDate(this.picturesMetadata)).pictureGroups()
		const flattenedGroups = PictureGroupHelper.flattenGroups(this.pictureGroups);
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
        .row {
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
    @Input() pictureModal: PictureModal
    defaultImage = '/a/b.jpg';
    pictureSrc: string
    offset = 100;
    ngOnInit(){
        this.pictureSrc = "/picture/" + this.pictureMetadata.hashValue + "?h=200"
    }
    openModal() {
		//        this.pictureModal.open(this.pictureMetadata)
		this.pictureModal.show();
    }

}