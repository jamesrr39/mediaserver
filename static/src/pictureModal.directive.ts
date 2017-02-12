import { Directive, ElementRef, Component, HostListener, Injectable } from '@angular/core';
//import { Directive, ElementRef, Component, Injectable } from '@angular/core';

import { PictureMetadata } from './pictureMetadata';
//
//@Directive({
//    selector: "[pictureModal]"
//})
////@Injectable()
//export class PictureModalDirective {
//    constructor(private el: ElementRef){}
//    @HostListener('click') 
//    onClick(){
//        console.log("clicked!")
//    }
//    open(pictureMetadata: PictureMetadata){
//        console.log(pictureMetadata.hashValue)
//        console.log("element", this.el)
//    }
//}

@Component({
    selector: "picture-modal",
    template: `
    <div>
        <div [class.selected]="isOpen">
            <div class="modal-mask"></div>
            <div class="modal">
                <img [src]="defaultImage" [lazyLoad]=pictureSrc [offset]="offset">
            </div>
        </div>
    </div>
    `,
    styles: [`
    .selected .modal-mask {
        opacity: 0.8;
        background-color: black;
        height: 100%;
        width: 100%;
        position: fixed;
        top: 0px;
        left: 0px;
    }
    `]
})
@Injectable()
export class PictureModal {
    isOpen: boolean
    defaultImage = "a/b.jpg"
    offset = 100
    
    pictureSrc: string
    constructor(){
        this.isOpen = false;
        console.log("sssd")
    }
    open(pictureMetadata: PictureMetadata){
        // add class when opened?
        console.log("opening modal in open()")
        this.isOpen = true;
        
        console.log(this.isOpen)
//        this.pictureSrc = "/picture/" + pictureMetadata.hashValue + "?h=600"
    }
    setClasses(){
        return {
            selected: this.isOpen
        }
    }
}