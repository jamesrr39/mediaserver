import { Component, OnInit, Input, ViewChild } from '@angular/core';
import { PictureMetadataService } from './picturesMetadata.service'
import { PictureMetadata } from './pictureMetadata'
import { PictureGroup, PictureGroupHelper } from './pictureGroup';
import { PicturesByDate } from './picturesByDate';

import { PictureModal } from './pictureModal/pictureModal.component';
import { UploadModal } from './uploadModal.component';

@Component({
    selector: 'picture-gallery',
    template: `
        <div class="widget-container">
			<div class="row header-toolbar">
				<div class="col-xs-12">
					<ul class="list-unstyled">
						<li>
							<button>
								Refresh
							</button>
						</li>
						<li (click)="openUploadModal()"
							(mouseover)="$event.target.classList.add('hover-active')"
							(mouseout)="$event.target.classList.remove('hover-active')">
							<button>
								<i class="glyphicon glyphicon-upload"></i>
								Upload
							</button>
						</li>
					</ul>
				</div>
			</div>
			<div class="row gallery">
				<div *ngFor="let pictureGroup of pictureGroups">
					<picture-group [pictureGroup]="pictureGroup" [pictureModal]="pictureModal"></picture-group>
				</div>
			</div>
        </div>

		<picture-modal [picturesMetadata]="picturesMetadata">
		</picture-modal>

		<upload-modal></upload-modal>
      `,
	styles: [`
		.gallery {
			margin: 40px 10px 10px;
		}
		.header-toolbar {
			position: fixed;
			top: 0px;
			width: 100%;
			height: 40px;
			background-color: #337ab7;
			z-index: 1;
		}
		.header-toolbar li {
			float: left;
			height: 100%;
		}
	  `],
    providers: [PictureMetadataService]
})
export class PictureGallery implements OnInit {
    pictureGroups: PictureGroup[]
	private picturesMetadata: PictureMetadata[] = []

	@ViewChild(PictureModal)
	public readonly pictureModal: PictureModal;

	@ViewChild(UploadModal)
	public readonly uploadModal: UploadModal;

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
    updateRendering() {
        this.pictureGroups = (new PicturesByDate(this.picturesMetadata)).pictureGroups()
		const flattenedGroups = PictureGroupHelper.flattenGroups(this.pictureGroups);
	}
	openUploadModal() {
		this.uploadModal.show();
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
		this.pictureModal.show(this.pictureMetadata);
    }

}
