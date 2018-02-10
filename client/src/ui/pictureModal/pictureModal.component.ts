import { Component, Input, Inject, ViewChild, ElementRef, trigger, state, style, transition, animate } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { PictureMetadata } from '../../domain/pictureMetadata';
import { Observable, Subscription } from 'rxjs';
import { RawInfoContainer } from "./rawInfo.component";
// import { slideInOutAnimation } from "../animations/slideAnimation";

const LEFT_ARROW_KEYCODE = 37;
const RIGHT_ARROW_KEYCODE = 39;



@Component({
	selector: 'picture-modal',
	animations: [
		trigger("rawInfoDivState", [
			state("closed", style({
				display: "none",
				width: 0,
			})),
			state("open", style({
				flex: "0 0 400px",
				display: "inline-block",
				// width: "400px",
			})),
			transition("closed <=> open", animate(300))
		])
	],
	host: {
	 	'(window:keydown)': 'onKeypress($event)'
	},
	template: `
	<div (click)="onContainerClicked($event)" class="modal fade" tabindex="-1" [ngClass]="{'in': visibleAnimate}"
	   [ngStyle]="{'display': visible ? 'block' : 'none', 'opacity': visibleAnimate ? 1 : 0}">
	  <div class="modal-dialog">
	    <!-- start content -->
			<div class="modal-content-container">
		    <div class="picture-container" #pictureContainer>
		      <!-- start control buttons -->
		      <div class="top-row" style="display:flex; flex-direction: row;">
		        <div>
		          <h3>{{ pictureDisplayName }}</h3>
		          <p>{{ dateTakenString }}</p>
		        </div>
		        <div class="pull-right actions-buttons-container">
		          <i (click)="onShowRawInformationClicked()" class="glyphicon glyphicon-info-sign" aria-label="Information"></i>
		          <i (click)="hide()" class="glyphicon glyphicon-remove" aria-label="Close"></i>
		        </div>
		      </div>
		      <!-- end control buttons -->
		      <div class="main-content">
		        <div (click)="showPrevious()" class="show-previous">&larr;</div>
		        <img src="/picture/{{ pictureHashValue }}" class="picture" />
		        <div (click)="showNext()" class="show-next">&rarr;</div>
		      </div>
		    </div>
		    <div class="raw-info-container-state" [@rawInfoDivState]="rawInfoContainerState">
		      <raw-info-container></raw-info-container>
		    </div>
			</div>
	    <!-- end content -->
	  </div>
	</div>
	`,
	styles: [`
		.modal-content-container {
			display: flex;
		}

		.modal-dialog {
			color: white !important;
			width: auto;
			text-align: center;
			height: 100%;
			margin: 0;
		}
		.actions-buttons-container {
			margin-right: 20px;
		}
		.actions-buttons-container * {
			cursor: pointer;
			font-size: 20px;
			margin-left: 15px;
			margin-top: 20px;
		}
		.show-next {
			right: 0px;
		}
		.show-previous {
			left: 0px;
		}
		.show-previous,.show-next {
			min-width: 50px;
			flex-grow: 0;
			cursor: pointer;
			font-size: 1.5em;
			position: absolute;
			top: 50%;
		}

		.picture {
			flex-shrink: 1;
		}

		.picture-container {
			overflow: auto;
			display: flex;
	    align-items: center;
			flex-direction: column;
			flex-grow: 1;
		}

		.top-row {
			flex-grow: 0;
		}
		.main-content {
			position: relative;
			width: 100%;
		}
		.raw-info-container-state {
			background-color: white;
			color: black;
		}
  `],
})
export class PictureModal {
	private rawInfoContainerState = "closed";

	public visible = false;
	public visibleAnimate = false;

	private pictureMetadata: PictureMetadata;
	private pictureDisplayName: string
	private pictureHashValue: string
	private dateTakenString: string

	private isRawInfoShown = false;

	private resizeSubscription: Subscription;

	@Input() picturesMetadata: PictureMetadata[];


  @ViewChild(RawInfoContainer)
  public readonly rawInfoContainer: RawInfoContainer;

	@ViewChild("pictureContainer")
	private readonly pictureContainer: ElementRef;

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
		if (0 === indexOfPicture) {
			return;
		}

		this.updatePictureMetadata(this.picturesMetadata[indexOfPicture - 1]);
	}
	private showNext() {
		const indexOfPicture = this.picturesMetadata.indexOf(this.pictureMetadata);
		if (this.picturesMetadata.length === (indexOfPicture + 1)) {
			return;
		}

		this.updatePictureMetadata(this.picturesMetadata[indexOfPicture + 1]);
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

		this.rawInfoContainer.update(pictureMetadata);
		this.updatePicture();
	}

	private updatePicture() {
		const bucketedWidth = PictureSizeCalculator.getBucketedWidth(this.window.innerWidth);
		const bucketedHeight = PictureSizeCalculator.getBucketedHeight(this.window.innerHeight);

		this.pictureHashValue = this.pictureMetadata.hashValue + `?w=${bucketedWidth}&h=${bucketedHeight}`;
	}

	private onShowRawInformationClicked() {


		this.rawInfoContainerState = (this.rawInfoContainerState === "closed") ? "open" : "closed";
		// if (this.isRawInfoShown) {
		// 	this.pictureContainer // to col-md-12
		// 	this.rawInfoContainer // hide
		// }
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
