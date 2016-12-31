import { Injectable } from '@angular/core';
import { Http, Response } from '@angular/http'
import { Observable } from 'rxjs/Observable';
import './rxjs-operators'

import { PictureMetadata } from './pictureMetadata';

@Injectable()
export class PictureMetadataService {
    constructor (private http: Http) {}
    
//    url: "http://localhost:6050/api/pictureMetadata/"
    
    fetch (): Observable<PictureMetadata[]> {
        return this.http.get("/api/pictureMetadata/").map((r: Response) => {
            let metadatasJSON = r.json() as PictureMetadataJSON[];
            return metadatasJSON.map(metadataJSON => {
                let exifMap = new Map<string, any>();
                Object.keys(metadataJSON.exif).forEach((k) => {
                    let v = metadataJSON.exif[k];
                    exifMap.set(k, v);
                })
                return new PictureMetadata(metadataJSON.hashValue, metadataJSON.relativeFilePath, metadataJSON.fileSizeBytes, exifMap);
            })
        });
    }
    upload(file: File): Observable<Response> {
        let formData = new FormData();
        formData.append("file", file);
        return this.http.post("/picture/", formData);
    }
}

class PictureMetadataJSON {
    hashValue: string
    relativeFilePath: string
    fileSizeBytes: number
    exif: Object
}