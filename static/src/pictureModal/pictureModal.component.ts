import { Component } from '@angular/core';
import { PictureMetadata } from '../pictureMetadata';

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
		</div>
	</div>
  `
})
export class PictureModal {

	public visible = false;
	public visibleAnimate = false;

	private pictureMetadata: PictureMetadata;
	private pictureDisplayName: string

	public show(pictureMetadata: PictureMetadata): void {
		this.pictureMetadata = pictureMetadata;
		this.pictureDisplayName = pictureMetadata.getFileName();

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
}