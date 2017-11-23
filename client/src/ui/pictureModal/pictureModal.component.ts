import { Component, Input, Inject } from '@angular/core';
import { PictureMetadata } from '../../domain/pictureMetadata';
import { Observable, Subscription } from 'rxjs';

const LEFT_ARROW_KEYCODE = 37;
const RIGHT_ARROW_KEYCODE = 39;

@Component({
	selector: 'picture-modal',
	template: `
	<div (click)="onContainerClicked($event)" class="modal fade" tabindex="-1" [ngClass]="{'in': visibleAnimate}"
		 [ngStyle]="{'display': visible ? 'block' : 'none', 'opacity': visibleAnimate ? 1 : 0}">
		<div class="modal-dialog">
    	<div class="row">
				<div class="col-sm-3"></div>
				<div class="col-sm-6">
					<h3>{{ pictureDisplayName }}</h3>
					<p>{{ dateTakenString }}</p>
				</div>
				<div class="col-sm-3">
					<div class="pull-right actions-buttons-container">
						<i (click)="showRawData()" class="glyphicon glyphicon-info-sign" aria-label="Information"></i>
						<i (click)="hide()" class="glyphicon glyphicon-remove" aria-label="Close"></i>
					</div>
				</div>
			</div>
			<div class="row">
				<div class="picture-container">
					<div (click)="showPrevious()" class="show-previous">
						&lt;
					</div>
					<img src="/picture/{{ pictureHashValue }}" class="picture">
					<div (click)="showNext()" class="show-next">
						&gt;
					</div>
				</div>
				<div class="raw-data-container">
					Raw data here
				</div>
			</div>
		</div>
	</div>
  `,
	styles: [`
	.modal-dialog {
		color: white !important;
		width: auto;
		text-align: center;
	}
	.actions-buttons-container {
		margin-right: 20px;
	}
	.actions-buttons-container * {
		cursor: pointer;
		font-size: 40px;
		margin-left: 15px;
		margin-top: 20px;
	}

	.show-previous {
		min-width: 50px;
		flex-grow: 1;
		cursor: pointer;
	}
	.show-next {
		min-width: 50px;
		flex-grow: 1;
		cursor: pointer;
	}


	.picture-container {
		overflow: auto;
		display: flex;
	}
  `],
	host: { '(window:keydown)': 'onKeypress($event)' },
})
export class PictureModal {

	public visible = false;
	public visibleAnimate = false;

	private pictureMetadata: PictureMetadata;
	private pictureDisplayName: string
	private pictureHashValue: string
	private dateTakenString: string

	private resizeSubscription: Subscription;

	@Input() picturesMetadata: PictureMetadata[];

	constructor( @Inject('Window') private window: Window) { }

	public show(pictureMetadata: PictureMetadata): void {
		this.updatePictureMetadata(pictureMetadata);

		this.visible = true;
		setTimeout(() => this.visibleAnimate = true, 100);

		this.resizeSubscription = Observable.fromEvent(this.window, "resize")
		.debounceTime(150)
		.subscribe((event) => {
			this.updatePicture();
		});
	}

	public hide(): void {
		this.visibleAnimate = false;
		setTimeout(() => this.visible = false, 300);
		this.resizeSubscription.unsubscribe();
	}

	private onKeypress(event: KeyboardEvent) {
		if (event.keyCode === LEFT_ARROW_KEYCODE) {
			this.showPrevious();
		} else if (event.keyCode === RIGHT_ARROW_KEYCODE) {
			this.showNext();
		}
	}

	private showPrevious() {
		const indexOfPicture = this.picturesMetadata.indexOf(this.pictureMetadata);
		if (0 === indexOfPicture){
			return;
		}

		this.updatePictureMetadata(this.picturesMetadata[indexOfPicture -1]);
	}
	private showNext() {
		const indexOfPicture = this.picturesMetadata.indexOf(this.pictureMetadata);
		if (this.picturesMetadata.length === (indexOfPicture +1)){
			return;
		}

		this.updatePictureMetadata(this.picturesMetadata[indexOfPicture +1]);
	}

	public onContainerClicked(event: MouseEvent): void {
		if ((<HTMLElement>event.target).classList.contains('modal')) {
			this.hide();
		}
	}

	private updatePictureMetadata(pictureMetadata: PictureMetadata) {
		this.pictureMetadata = pictureMetadata;
		this.pictureDisplayName = pictureMetadata.getFileName();
		const dateTaken = pictureMetadata.getDateTimeTaken();
		this.dateTakenString = (null === dateTaken) ?
			"No date information available for this picture" :
			`Taken at ${dateTaken.toString()}`

		this.updatePicture();
	}

	private updatePicture() {
		const bucketedWidth = PictureSizeCalculator.getBucketedWidth(this.window.innerWidth);
		const bucketedHeight = PictureSizeCalculator.getBucketedHeight(this.window.innerHeight);

		this.pictureHashValue = this.pictureMetadata.hashValue + `?w=${bucketedWidth}&h=${bucketedHeight}`;
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
		<ul>
			<li *ngFor="let exifDatum of exifData">
				{{ exifDatum }}
			</li>
		</ul>
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
