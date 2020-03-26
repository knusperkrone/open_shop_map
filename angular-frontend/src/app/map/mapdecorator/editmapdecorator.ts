import { MapDecorator } from './mapdecorator';
import { MapComponent } from '../map.component';
import { Shop } from 'src/app/models/dto';
import { ComponentRef } from '@angular/core';
import { EditContentComponent } from '../editcontent/editcontent.component';


export class EditMapDecorator implements MapDecorator {

  private componentRef: ComponentRef<EditContentComponent>;

  constructor(private parent: MapComponent) { }

  getMapStyles(): google.maps.MapTypeStyle[] {
    return [
      {
        featureType: 'transit',
        stylers: [
          { visibility: 'off' }
        ]
      },
      {
        featureType: "poi",
        stylers: [
          { visibility: "on" }
        ]
      },
    ]
  }

  mapInited(payload: any = null) {
    this.parent.map.addListener('click', (event) => this.poiClick(event));
    this.parent.map.addListener('rightclick', (event) => this.mapRightClick(event));
    if (payload) {
      setTimeout(() => this.markerClick(payload as Shop), 0);
    }
  }

  composeMarker(marker: google.maps.Marker, shop: Shop) {
    google.maps.event.addDomListener(marker, 'rightclick', () => this.markerClick(shop));
    google.maps.event.addDomListener(marker, 'click', () => this.markerClick(shop));
  }

  dispose(): void {
    if (this.componentRef) {
      this.parent.infoWindowChild.remove(0);
    }
    google.maps.event.clearListeners(this.parent.map, 'click');
    google.maps.event.clearListeners(this.parent.map, 'rightclick');
    this.parent.cluster.getMarkers().forEach((marker) => {
      google.maps.event.clearListeners(marker, 'rightclick');
      google.maps.event.clearListeners(marker, 'click');
    });
  }

  private mapRightClick(event) {
    this.parent.showOverlay(
      "Shop hinzufügen",
      event,
      () => {
        this.parent.closeOverlay();
        this.parent.map.setZoom(Math.max(16, this.parent.map.getZoom()));
        this.parent.map.panTo(event.latLng);
        this.parent.snackBar.open(`Um einen Shop hinzuzufügen klicke auf einen Maps Eintrag!`, "Ok", {
          duration: 6000,
        });
      },
    );
  }

  private markerClick(shop: Shop) {
    this.initIfNecessary();
    this.componentRef.instance.setShop(shop);
    this.parent.infowindow.setPosition(new google.maps.LatLng(shop.lat, shop.lon));
    this.parent.infowindow.open(this.parent.map);
  }

  private poiClick(event: any) {
    event.stop();
    if (event.placeId) {
      this.parent.placeService.getInformation(event.placeId,
        (place, status) => {
          if (status === 'OK') {
            this.initIfNecessary();
            this.componentRef.instance.setPlace(place);
            this.parent.infowindow.setPosition(place.geometry.location);

            this.parent.infowindow.open(this.parent.map);
          }
        });
    }
  }

  private initIfNecessary() {
    if (!this.componentRef) {
      const componentFactory = this.parent.componentFactoryResolver.resolveComponentFactory(EditContentComponent);
      const componentRef = this.parent.infoWindowChild.createComponent(componentFactory);
      this.componentRef = componentRef;
      this.parent.infowindow.setContent(this.componentRef.location.nativeElement);

      this.componentRef.instance.shopService = this.parent.shopService;
      this.componentRef.instance.snackBar = this.parent.snackBar;
      this.componentRef.instance.setCloseCallback(() => this.parent.infowindow.close());
      this.componentRef.instance.setAddShopCallback((shop) => this.parent.cluster.addMarker(this.parent.addShopMarker(shop)));
      this.componentRef.instance.setUpdateShopCallback((shop) => { /* TODO: */ })
    }
  }

}
