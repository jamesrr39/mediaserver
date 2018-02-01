import { Component } from "@angular/core";
import { PictureMetadata } from "../../domain/pictureMetadata";

type ExifData = {
	key: string;
	value: string;
}

@Component({
	selector: "raw-info-container",
	template: `
		<ul class="list-unstyled">
			<li *ngFor="let exifDatum of exifData">
				{{ exifDatum.key }} : {{ exifDatum.value }}
			</li>
		</ul>
	`
})
export class RawInfoContainer {
	private exifData: ExifData[] = [];

	update(pictureMetadata: PictureMetadata) {
		if (pictureMetadata.exif) {
			this.exifData = [];
			pictureMetadata.exif.forEach((v, k) => {
				this.exifData.push({
					key: k,
					value: v
				});
			});
		}
	}
}
