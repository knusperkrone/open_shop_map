import { MapDecorator } from './mapdecorator';
import { MapComponent } from '../map.component';
import { Shop } from 'src/app/models/dto';
import { ShowContentComponent } from '../showcontent/showcontent.component';
import { ComponentRef } from '@angular/core';


export class ShowMapDecorator implements MapDecorator {

  private componentRef: ComponentRef<ShowContentComponent>;

  constructor(private parent: MapComponent) { }

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

  mapInited(payload: any = null) {
    this.parent.map.addListener('rightclick', (event) => this.mapRightClick(event));
  }

  showShop(shop: Shop) {
    this.markerClick(shop);
  }

  showPlace(place: google.maps.places.PlaceResult) {
    throw new Error("Method not implemented.");
  }

  composeMarker(marker: google.maps.Marker, shop: Shop) {
    google.maps.event.addDomListener(marker, 'click', () => this.markerClick(shop));
    google.maps.event.addDomListener(marker, 'rightclick', () => this.markerRightClick(marker, shop));
  }

  dispose(): void {
    if (this.componentRef) {
      this.parent.infoWindowChild.remove(0);
    }
    google.maps.event.clearListeners(this.parent.map, 'rightclick');
    this.parent.cluster.getMarkers().forEach((marker) => {
      google.maps.event.clearListeners(marker, 'rightclick');
      google.maps.event.clearListeners(marker, 'click');
    });
  }

  private markerClick(shop: Shop) {
    this.initIfNecessary();
    this.parent.closeOverlay();
    this.componentRef.instance.setShop(shop);
    this.parent.infowindow.setPosition(new google.maps.LatLng(shop.lat, shop.lon));
    this.parent.infowindow.open(this.parent.map);
  }

  private markerRightClick(marker, shop: Shop) {
    this.parent.showOverlay(
      "Shop editieren",
      marker.getPosition(),
      () => {
        this.parent.closeOverlay();
        this.parent.switchMode(shop);
      },
    );
  }

  private mapRightClick(event) {
    let me = this;
    this.parent.showOverlay(
      'Bearbeitungsmodus',
      event,
      () => {
        me.parent.closeOverlay();
        me.parent.switchMode();
      },
    );
  }

  private initIfNecessary() {
    if (!this.componentRef) {
      const componentFactory = this.parent.componentFactoryResolver.resolveComponentFactory(ShowContentComponent);
      const componentRef = this.parent.infoWindowChild.createComponent(componentFactory);
      this.componentRef = componentRef;
      this.parent.infowindow.setContent(this.componentRef.location.nativeElement);
    }
  }

}
