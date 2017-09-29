import { Injectable } from '@angular/core';
import { Http, Response, Headers, RequestOptions } from '@angular/http'
import { Observable } from 'rxjs/Observable';
import '../rxjs-operators'

import { PictureMetadata } from '../domain/pictureMetadata';

@Injectable()
export class PictureMetadataService {
    constructor (private http: Http) {}

	fetch(): Observable<PictureMetadata[]> {
		const self = this;

        return this.http.get("/api/pictureMetadata/").map((r: Response) => {
            let metadatasJSON = r.json() as PictureMetadataJSON[];
			return metadatasJSON.map(metadataJSON => {
                return self.jsonToPictureMetadata(metadataJSON);
			});
        });
    }
	upload(file: File): Observable<PictureMetadata> {
		const formData = new FormData();
        formData.append("file", file);
		return this.http.post("/picture/", formData).map((r: Response) => {
			let metadataJSON = r.json() as PictureMetadataJSON
			return this.jsonToPictureMetadata(metadataJSON);
		});
	}
    jsonToPictureMetadata(metadataJSON: PictureMetadataJSON): PictureMetadata {
		let exifMap: Map<string, any>
        if (metadataJSON.exif) {

            exifMap = new Map<string, any>();
            Object.keys(metadataJSON.exif).forEach((k) => {
                let v = metadataJSON.exif[k];
                exifMap.set(k, v);
            });
        } else {
            exifMap = null;
        }
        return new PictureMetadata(metadataJSON.hashValue, metadataJSON.relativeFilePath, metadataJSON.fileSizeBytes, exifMap);
    }
}

class PictureMetadataJSON {
    hashValue: string
    relativeFilePath: string
    fileSizeBytes: number
    exif: Object
}
