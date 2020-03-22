import { Component, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { LocationService } from '../../service/location.service';
import { Shop } from '../../models/dto';
import { BaseMapComponent } from '../basemap.compontent';
import { ShowContentComponent } from './showcontent/showcontent.component';
import { Router } from '@angular/router';


@Component({
  selector: 'app-showmap',
  templateUrl: './showmap.component.html',
  styleUrls: ['./showmap.component.scss']
})
export class ShowMapComponent extends BaseMapComponent {

  @ViewChild('infoContainer', { static: false }) infowindowContent: ElementRef;
  @ViewChild('infoContent', { static: false }) contentChild: ShowContentComponent;
  infowindow: google.maps.InfoWindow;

  constructor(locationService: LocationService, router: Router) {
    super(locationService, router);
  }

  getMapStyles(): google.maps.MapTypeStyle[] {
    return [
      {
        featureType: "poi",
        stylers: [
          { visibility: "off" }
        ]
      },
      {
        featureType: "transit",
        stylers: [
          { visibility: "off" }
        ]
      },
    ]
  }

  mapInited() {
    // define window
    this.infowindow = new google.maps.InfoWindow({
      content: this.infowindowContent.nativeElement,
      maxWidth: 240,
    });
  }

  composeMarker(marker: google.maps.Marker, shop: Shop) {
    const me = this;
    google.maps.event.addDomListener(marker, 'click', function () {
      me.infowindow.setPosition(marker.getPosition());
      me.infowindow.open(this.map);
      me.contentChild.setShop(shop);
    });
  }

}
