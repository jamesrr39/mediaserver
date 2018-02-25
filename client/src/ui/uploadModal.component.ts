import { Component, Input } from '@angular/core';
import { PictureMetadataService } from '../service/picturesMetadata.service';

import { NotificationService } from '../service/notificationService';
import { PictureMetadata } from "../domain/pictureMetadata";

type FileUploadedCallback = (pictureMetadata: PictureMetadata) => void;

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
					<div class="files-preview-container">
						<div class="files-preview" *ngFor="let file of filesToUpload">
							<span class="glyphicon glyphicon-trash remove" (click)="remove(file)"></span>
							<image-upload-preview [file]="file"></image-upload-preview>
						</div>
					</div>
				</div>
				<div class="modal-footer">
					<button type="button" class="btn btn-primary {{isUploading ? 'disabled' : ''}}" (click)="upload($event)">Upload</button>
				</div>
			</div>
		</div>
	</div>
`,
styles: [`
	.modal-dialog {
		width: 95%;
	}

	.remove {
		float: right;
	}

	.files-preview {
		float: left;
		margin: 5px;
		height: 200px;
		border: 1px grey dashed;
		padding: 5px;
	}

	.files-preview-container {
		overflow: auto;
	}
	`]
})
export class UploadModal {

	private visible: boolean;
	private visibleAnimate: boolean;

	private filesToUpload: File[] = [];

	private isUploading = false;

	@Input() notificationService: NotificationService;

	@Input() onUploadCallback: FileUploadedCallback;

	constructor(private pictureMetadataService: PictureMetadataService) {}

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
		}
		this.filesToUpload = oldFileList;
	}

	private remove(file: File) {
		const index = this.filesToUpload.indexOf(file);
		this.filesToUpload.splice(index, 1);
	}

	private upload(event: Event) {
		if (this.isUploading) {
			// already uploading; reject click
			return;
		}
		this.isUploading = true;

		const onUploadResponse = (file: File) => {
			this.remove(file);
			if (this.filesToUpload.length === 0) {
				this.isUploading = false;
			}
		};

		this.filesToUpload.forEach((file) => {
			const observable = this.pictureMetadataService.upload(file).subscribe((pictureMetadata) => {
				this.notificationService.success("succesfully uploaded " + file.name);
				onUploadResponse(file);
				this.onUploadCallback(pictureMetadata);
			}, (response: Response) => {
				onUploadResponse(file);
				this.notificationService.error(`couldn't upload ${file.name}. Status Text: ${response.statusText}. Error: ${response.text()}`);
			});
		});
	}

}


type FileListTarget = {
	target: {
		files: FileList
	}
}

@Component({
	selector: "image-upload-preview",
	template: `
	<div>
		<img src="{{ imageSrc }}" class="upload-image" />
		<br>
		{{ file.name }}
	</div>
	`,
	styles: [`
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
