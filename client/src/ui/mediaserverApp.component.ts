import { Component } from '@angular/core';
@Component({
    selector: "mediaserver-app",
    template: `
    <div class="container">
    <div class="row header-toolbar">
      <div class="col-xs-12">
        <ul class="list-unstyled">
          <li>
            <button class="btn btn-default">
              Refresh
            </button>
          </li>
          <li (click)="openUploadModal()"
            (mouseover)="$event.target.classList.add('hover-active')"
            (mouseout)="$event.target.classList.remove('hover-active')">
            <button class="btn btn-default">
              <i class="glyphicon glyphicon-upload"></i>
              Upload
            </button>
          </li>

          <li>Picture Gallery</li>
        </ul>
      </div>
    </div>
      <picture-gallery>Loading AppComponent content here ...</picture-gallery>
    </div>
    `
})
export class MediaserverApp {}
