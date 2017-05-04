import { Component } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Subscription';
import { PictureMetadata } from './pictureMetadata';

@Component({
    selector: "picture-modal",
    template: ""
})
export class PictureModal {
    private maskEl: HTMLElement;
    private modalEl: HTMLElement;
    
    private innerModalComponent: InnerPictureModal;
    
	constructor(picturesMetadata: PictureMetadata[]){
		this.innerModalComponent = new InnerPictureModal(picturesMetadata);
        injectStyleSheet();
    }
    open(pictureMetadata: PictureMetadata){
        
        this.maskEl = document.createElement("div");
        this.maskEl.className = "picture-modal-mask";
        this.maskEl.addEventListener("click", (event: MouseEvent) => {
            this.close();
        });
        
        this.modalEl = document.createElement("div");
        this.modalEl.className = "picture-modal";

        this.innerModalComponent.show(this.modalEl, pictureMetadata);
        document.body.appendChild(this.maskEl);
        document.body.appendChild(this.modalEl);
    }
    close(){
        this.innerModalComponent.close();
        this.maskEl.remove();
        this.modalEl.remove();
    }
}



class InnerPictureModal {
    
    pictureMetadata: PictureMetadata;
    containerEl: HTMLElement;
	resizeSubscription: Subscription
	keyUpSubscription: Subscription
    
	constructor(private picturesMetadata: PictureMetadata[]){}
    
    show(containerEl: HTMLElement, startingPictureMetadata: PictureMetadata){
        this.containerEl = containerEl;
		this.render(startingPictureMetadata);
		this.resizeSubscription = Observable.fromEvent(window, "resize").debounceTime(300).subscribe(this.onResize.bind(this));
		this.keyUpSubscription = Observable.fromEvent(window, "keyup").subscribe(this.onKeyUp.bind(this));
		
    }
	
	private render(pictureMetadata: PictureMetadata){
		this.pictureMetadata = pictureMetadata;
        const width = this.getBucketedDimension(document.documentElement.clientWidth -100);
        const height = this.getBucketedDimension(document.documentElement.clientHeight -100);
        this.containerEl.innerHTML = this.buildTemplate(pictureMetadata, width, height);
		this.containerEl.getElementsByClassName("show-raw-info")[0].addEventListener("click", () => {
			
		})
    }
    
    close() {
		this.resizeSubscription.unsubscribe();
		this.keyUpSubscription.unsubscribe();
    }
    
    private onResize() {
		this.render(this.pictureMetadata);
    }
	
	private onKeyUp(event: KeyboardEvent) {
		// 39 right
		// 37 left
		const indexOfPictureMetadata = this.picturesMetadata.indexOf(this.pictureMetadata);
		
		switch (event.keyCode) {
			case 39:
				const nextPictureMetadata = this.picturesMetadata[indexOfPictureMetadata +1];
				if (nextPictureMetadata) {
					this.render(nextPictureMetadata);
				}
			break;
			case 37:
				const previousPictureMetadata = this.picturesMetadata[indexOfPictureMetadata -1];
				if (previousPictureMetadata) {
					this.render(previousPictureMetadata);
				}
			break;
		}
	}

    /**
     * round up size to nearest 100px
     */
    private getBucketedDimension(size: number){
        return Math.ceil(size / 100) * 100;
    }

    private buildTemplate(pictureMetadata: PictureMetadata, width: number, height: number){
        const timeDisplay = pictureMetadata.getDateTimeTaken()
            ? pictureMetadata.getDateTimeTaken().toUTCString()
            : "Unknown";
            
        return `
		<div class="picture-modal-inner">
			<h3>${pictureMetadata.relativeFilePath}</h3>
			<p>Taken ${timeDisplay}</p>
			<div class="content row">
				<div class="picture-container">
					<img onload='console.log(this);' src='/picture/${pictureMetadata.hashValue}?w=${width}&h=${height}' alt='${pictureMetadata.getFileName()}' />
				</div>
				<div class="details-container" style="display: none">
					<h3>Details</h3>
					<p>${InnerPictureModal.fileSizeToDisplay(pictureMetadata.fileSizeBytes)}</p>
					<div class="exif-container">${this.buildExifDisplay(pictureMetadata)}
				</div>
			</div>
			<div class="row">
				<button class="btn btn-default show-raw-info">info</button>
			</div>
		</div>
		`; // TODO XSS relativeFilePath
    }
    
    private buildExifDisplay(pictureMetadata: PictureMetadata): string {
        if (null === pictureMetadata.exif){
            return "No exif data";
        }
        
        let displayString = "<ul>";
        pictureMetadata.exif.forEach((v, k) => {
            displayString += `<li>${k}: ${JSON.stringify(v)}</li>`;
        })
        return displayString + "</ul>";
    }
	
	static fileSizeToDisplay(fileSizeBytes: number): string {
		const units = ["B", "KB", "MB", "GB"];
		for (let index = (units.length -1); index >= 0; index--) {
			const sizeOfOneOfUnit = 1024 ** index;
			if (fileSizeBytes > sizeOfOneOfUnit) {
				return (fileSizeBytes / sizeOfOneOfUnit).toFixed(2) + units[index];
			}
		}
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
            opacity: 0.9;
        }
        
        .picture-modal {
            z-index: 100001;
            position: fixed;
            top: 10px;
            left: 10%;
            width: auto;
        }
        
		.picture-modal .picture-modal-inner {
            color: white;
		}
		
        .picture-modal img {
            width: 100%
        }
        
        .picture-modal .details-container {
            color: white;
            margin-left: 100px;
        }
        
        .picture-modal .picture-container,.picture-modal .details-container {
            float: left;
        }
        
        .picture-modal .details-container .exif-container {
            overflow: auto;
        }
    `;
    document.head.appendChild(styleSheet);
}

