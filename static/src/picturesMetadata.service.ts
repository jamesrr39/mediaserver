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
        return this.http.get("/api/pictureMetadata/").map((r: Response) => r.json() as PictureMetadata[]);
    }
}