import { Component, ViewChild, ElementRef } from '@angular/core';
import { LocationService } from '../../service/location.service';
import { PlacesService } from '../../service/places.service';
import { NewContentComponent } from './newcontent/newcontent.component';
import { BaseMapComponent } from '../basemap.compontent';
import { Shop } from 'src/app/models/dto';
import { Router } from '@angular/router';

@Component({
  selector: 'app-editmap',
  templateUrl: './editmap.component.html',
  styleUrls: ['./editmap.component.scss']
})
export class EditmapComponent extends BaseMapComponent {

  constructor(locationService: LocationService, router: Router, private placeService: PlacesService) {
    super(locationService, router);
  }

  @ViewChild('infoContainer', { static: false }) infowindowContent: ElementRef;
  @ViewChild('infoContent', { static: false }) contentChild: NewContentComponent;
  infowindow: google.maps.InfoWindow;

  getMapStyles(): google.maps.MapTypeStyle[] {
    return [
      {
        featureType: "transit",
        stylers: [
          { visibility: "off" }
        ]
      },
    ]
  }

  mapInited(): void {
    // init service
    this.placeService.init(this.map);

    // define window
    this.infowindow = new google.maps.InfoWindow({
      content: this.infowindowContent.nativeElement,
      maxWidth: 240,
    });

    // add click listener clousure
    const me = this;
    this.contentChild.setCloseCallback(() => me.infowindow.close());
    this.contentChild.setAddShopCallback((shop) => this.cluster.addMarker(me.addShopMarker(shop)));
    this.map.addListener('click', (event) => me.poiClickListener(event));
    google.maps.event.addListener(this.infowindow, 'closeclick', () => {
      this.contentChild.reset();
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

  private poiClickListener(event: any) {
    console.dir(event);
    event.stop();
    if (event.placeId) {
      const me = this;
      this.placeService.getInformation(event.placeId,
        (place, status) => {
          if (status === 'OK') {
            me.infowindow.setPosition(place.geometry.location);
            me.infowindow.open(me.map);
            me.contentChild.setPlace(place);
          }
        });
    }
  }

}
