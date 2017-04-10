import { Directive, ElementRef, Component, HostListener, Injectable } from '@angular/core';
//import { Directive, ElementRef, Component, Injectable } from '@angular/core';

import { PictureMetadata } from './pictureMetadata';

@Directive({
    selector: "[pictureModal]",
})
//@Injectable()
export class PictureModal {
    private maskEl: HTMLElement;
    private modal: HTMLElement;
    
    constructor(private el: ElementRef){
        injectStyleSheet();
    }
    @HostListener('click') 
    onClick(){
        console.log("clicked!")
    }
    open(pictureMetadata: PictureMetadata){
        console.log(pictureMetadata.hashValue)
        console.log("element", this.el)
        
        this.maskEl = document.createElement("div");
        this.maskEl.className = "picture-modal-mask";
        this.maskEl.addEventListener("click", (event: MouseEvent) => {
            this.close();
        });
        
        this.modal = document.createElement("div");
        this.modal.className = "picture-modal";
        const width = document.documentElement.clientWidth -200;
        const height = document.documentElement.clientHeight -200;
        this.modal.innerHTML = `
            <img src='/picture/${pictureMetadata.hashValue}?w=${width}&h=${height}' alt='${pictureMetadata.getFileName()}' />
            <div class="details-container">
                <h3>Details</h3>
            </div>
            `;
        
        document.body.appendChild(this.maskEl);
        document.body.appendChild(this.modal);
    }
    close(){
        this.maskEl.remove();
        this.modal.remove();
    }
}
// css for modal
const injectStyleSheet = () => {
    const idName = "picture-modal-stylesheet";
    if (document.getElementById(idName)){
        // stylesheet already exists
        return;
    }
    
    const styleSheet = document.createElement("style");
    styleSheet.setAttribute("type", "text/css");
    styleSheet.setAttribute("id", idName);
    styleSheet.innerHTML = `
        .picture-modal-mask {
            background-color: black;
            z-index: 100000;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            opacity: 0.8;
        }
        
        .picture-modal {
            z-index: 100001;
            position: fixed;
            top: 100px;
            left: 10%;
            width: auto;
        }
        
        .picture-modal img {
            width: 100%
        }
        
        .picture-modal .details-container {
            color: white;
            float: left;
            
        }
    `;
    document.head.appendChild(styleSheet);
}
//
//@Component({
//    selector: "picture-modal",
//    template: `
//    <div>
//        <div [class.selected]="isOpen">
//            <div class="modal-mask"></div>
//            <div class="modal">
//                <img [src]="defaultImage" [lazyLoad]=pictureSrc [offset]="offset">
//            </div>
//        </div>
//    </div>
//    `,
//    styles: [`
//    .selected .modal-mask {
//        opacity: 0.8;
//        background-color: black;
//        height: 100%;
//        width: 100%;
//        position: fixed;
//        top: 0px;
//        left: 0px;
//    }
//    `]
//})
//@Injectable()
//export class PictureModal {
//    isOpen: boolean
//    defaultImage = "a/b.jpg"
//    offset = 100
//    
//    pictureSrc: string
//    constructor(){
//        this.isOpen = false;
//        console.log("sssd")
//    }
//    open(pictureMetadata: PictureMetadata){
//        // add class when opened?
//        console.log("opening modal in open()")
//        this.isOpen = true;
//        
//        console.log(this.isOpen)
////        this.pictureSrc = "/picture/" + pictureMetadata.hashValue + "?h=600"
//    }
//    setClasses(){
//        return {
//            selected: this.isOpen
//        }
//    }
//}
