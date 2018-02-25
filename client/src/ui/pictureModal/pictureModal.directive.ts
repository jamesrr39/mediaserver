import {Directive, HostListener, HostBinding} from '@angular/core';

@Directive({
  selector: '[pictureModal]'
})
export class PictureModalDirective {
  @HostBinding('class.open') isOpen = false;

  @HostListener('click') toggleOpen() {
    this.isOpen = true;
  }
}
