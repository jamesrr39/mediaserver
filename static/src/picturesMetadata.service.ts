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
        var self = this;
        
        return this.http.get("/api/pictureMetadata/").map((r: Response) => {
            let metadatasJSON = r.json() as PictureMetadataJSON[];
            return metadatasJSON.map(metadataJSON => {
                return self.jsonToPictureMetadata(metadataJSON);
            })
        });
    }
    upload(file: File): Observable<PictureMetadata> {
        let formData = new FormData();
        formData.append("file", file);
        return this.http.post("/picture/", formData).map((r: Response) => {
            let metadataJSON = r.json() as PictureMetadataJSON
            return this.jsonToPictureMetadata(metadataJSON);
        });
    }
    jsonToPictureMetadata(metadataJSON: PictureMetadataJSON): PictureMetadata {
        var exifMap: Map<string, any>
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