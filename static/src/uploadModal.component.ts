import { Component, Input } from '@angular/core';
import { PictureMetadataService } from './picturesMetadata.service';

@Component({
	selector: "upload-modal",
	template: `
	<div (click)="onContainerClicked($event)" class="modal fade" tabindex="-1" [ngClass]="{'in': visibleAnimate}"
		 [ngStyle]="{'display': visible ? 'block' : 'none', 'opacity': visibleAnimate ? 1 : 0}">
		<div class="modal-dialog">
			<div class="modal-content">
				<div class="modal-header">
					Upload
				</div>
				<div class="modal-body">
					<form method="POST" action="/pictures/">
						<input type="file" class="btn btn-primary" name="file" multiple="true" (change)="addFilesToList($event)">
					</form>
					<div>
						<div *ngFor="let file of filesToUpload">
							<image-upload-preview [file]="file"></image-upload-preview>
						</div>
					</div>
				</div>
				<div class="modal-footer">
					<button type="button" class="btn btn-primary" (click)="upload($event)">Upload</button>
				</div>
			</div>
		</div>
	</div>
`
})
export class UploadModal {

	private visible: boolean;
	private visibleAnimate: boolean;

	private filesToUpload: File[] = [];

	constructor(private pictureMetadataService: PictureMetadataService) { }

	public show(): void {
		this.visible = true;
		setTimeout(() => this.visibleAnimate = true, 100);
	}

	public hide(): void {
		this.visibleAnimate = false;
		setTimeout(() => this.visible = false, 300);
	}

	public onContainerClicked(event: MouseEvent): void {
		if ((<HTMLElement>event.target).classList.contains('modal')) {
			this.hide();
		}
	}

	addFilesToList(event: FileListTarget) {
		const oldFileList = this.filesToUpload;

		const fileList = event.target.files;
		for (let i = 0; i < fileList.length; i++) {
			const file = fileList[i];
			oldFileList.push(file);


//			this.pictureMetadataService.upload(fileList[i]).subscribe(pictureMetadata => {
//				pictureGallery.picturesMetadata.push(pictureMetadata);
//				pictureGallery.updateRendering();
//			});
		}
		this.filesToUpload = oldFileList;
	}

	private upload(event: Event) {
		console.log("clicked upload")
		this.filesToUpload.forEach((file) => {
			this.pictureMetadataService.upload(file).subscribe();
		});
	}

}


class FileListTarget {
	target: {
		files: FileList
	}
}

@Component({
	selector: "image-upload-preview",
	template: `
	<div>
		<img src="{{ imageSrc }}" class="upload-image" />
	</div>
	`,
	styles: [`
	@host-container {
		float: left;
	}
	.upload-image {
		max-height: 150px;
		max-width: 250px;
	}
	`]
})
export class ImageUploadPreview {
	@Input() file: File;

	imageSrc: string;


	ngOnInit() {
		this.readImage();
	}


	private readImage() {
		var reader = new FileReader();
		reader.onload = (event: FileReaderEvent) => {
			const imageAsBase64 = event.target.result;
			this.imageSrc = imageAsBase64;
		};
		reader.readAsDataURL(this.file);
	}
}

class FileReaderLoadEvent {
	target: {
		result: string
	}
}

interface FileReaderEventTarget extends EventTarget {
	result: string
}

interface FileReaderEvent extends Event {
	target: FileReaderEventTarget;
	getMessage(): string;
}