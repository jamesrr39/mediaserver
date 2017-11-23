import { Component, OnInit, Input, ViewChild, ElementRef, Inject } from '@angular/core';
import { PictureMetadataService } from '../service/picturesMetadata.service'
import { PictureMetadata } from '../domain/pictureMetadata'
import { PictureGroup, PictureGroupHelper } from './pictureGroup';
import { PicturesByDate } from './picturesByDate';

import { Observable } from 'rxjs';

import { PictureModal } from './pictureModal/pictureModal.component';
import { UploadModal } from '../ui/uploadModal.component';
import { NotificationService } from '../service/notificationService';

//import { NotificationsService } from 'angular2-notifications';

@Component({
    selector: 'picture-gallery',
    template: `
    <div class="container-fluid">
			<div class="row gallery">
				<div *ngFor="let pictureGroup of pictureGroups">
					<picture-group [pictureGroup]="pictureGroup" [pictureModal]="pictureModal"></picture-group>
				</div>
			</div>
    </div>

		<picture-modal [picturesMetadata]="picturesMetadata">
		</picture-modal>
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
export class PictureGallery {

  pictureGroups: PictureGroup[] = [];

  @Input() picturesMetadata: PictureMetadata[];

	@ViewChild(PictureModal)
	public readonly pictureModal: PictureModal;

  ngOnInit() {
        this.pictureGroups = (new PicturesByDate(this.picturesMetadata)).pictureGroups()
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
            min-height: 100px;
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
