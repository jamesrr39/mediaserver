import { Component, Input, Inject } from '@angular/core';
import { PictureMetadata } from '../../domain/pictureMetadata';

/*


<div (click)="onContainerClicked($event)" class="modal fade" tabindex="-1" [ngClass]="{'in': visibleAnimate}"
		 [ngStyle]="{'display': visible ? 'block' : 'none', 'opacity': visibleAnimate ? 1 : 0}">
		<div class="modal-dialog">
			<div class="modal-content">
				<div class="modal-header">
					<ng-content select=".app-modal-header"></ng-content>
				</div>
				<div class="modal-body">
					<ng-content select=".app-modal-body"></ng-content>
				</div>
				<div class="modal-footer">
					<ng-content select=".app-modal-footer"></ng-content>
				</div>
			</div>
		</div>
	</div>


 */


@Component({
	selector: 'picture-modal',
	template: `
	<div (click)="onContainerClicked($event)" class="modal fade" tabindex="-1" [ngClass]="{'in': visibleAnimate}"
		 [ngStyle]="{'display': visible ? 'block' : 'none', 'opacity': visibleAnimate ? 1 : 0}">
		<div class="modal-dialog">
                <h3>{{ pictureDisplayName }}</h3>
				<p>{{ dateTakenString }}</p>
				<p (click)="showRawData">Raw Data</p>
				<div>
				<img src="/picture/{{ pictureHashValue }}">
				</div>
				<div class="raw-data-container">
				</div>
		</div>
	</div>
  `,
	styles: [`
	.modal-dialog {
		color: white !important;
	}
  `]
})
export class PictureModal {

	public visible = false;
	public visibleAnimate = false;

	private pictureMetadata: PictureMetadata;
	private pictureDisplayName: string
	private pictureHashValue: string
	private dateTakenString: string

	@Input() picturesMetadata: PictureMetadata[];

	constructor( @Inject('Window') private window: Window) { }

	private updateFields(pictureMetadata: PictureMetadata) {
		this.pictureMetadata = pictureMetadata;
		this.pictureDisplayName = pictureMetadata.getFileName();
		const dateTaken = pictureMetadata.getDateTimeTaken();
		this.dateTakenString = (null === dateTaken) ?
			"No date information available for this picture" :
			`Taken at ${dateTaken.toString()}`


		const bucketedWidth = PictureSizeCalculator.getBucketedWidth(this.window.innerWidth);
		const bucketedHeight = PictureSizeCalculator.getBucketedHeight(this.window.innerHeight);

		this.pictureHashValue = pictureMetadata.hashValue + `?w=${bucketedWidth}&h=${bucketedHeight}`;
		console.log(this.picturesMetadata.indexOf(pictureMetadata))
		console.log(this.window.innerWidth, this.window.innerHeight)
	}

	public show(pictureMetadata: PictureMetadata): void {
		this.updateFields(pictureMetadata);

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

	private showRawData() {

	}

}

class PictureSizeCalculator {
	static getBucketedWidth(windowWidth: number) {
		return Math.floor((windowWidth - 120) / 100) * 100;
	}

	static getBucketedHeight(windowHeight: number) {
		return Math.floor((windowHeight - 120) / 100) * 100;
	}
}

@Component({
	selector: "raw-info-container",
	template: `
	`
})
class RawInfoContainer {
	@Input() exifData: Map<String, any>;

	private exifDataList: string[]

	ngOnInit() {
		const list: string[] = [];
		this.exifData.forEach((v, k) => {
			list.push(`${k}: ${v}`);
		});


	}
}
