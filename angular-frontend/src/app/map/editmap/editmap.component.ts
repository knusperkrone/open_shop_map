import { Component, ViewChild, ElementRef, Renderer2, ComponentFactoryResolver, ViewContainerRef } from '@angular/core';
import { ShopService } from '../../service/location.service';
import { PlacesService } from '../../service/places.service';
import { BaseMapComponent } from '../basemap.compontent';
import { Shop } from 'src/app/models/dto';
import { Router } from '@angular/router';
import { EditContentComponent } from './editcontent/editcontent.component';
import { RouterExtra } from 'src/app/models/state';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-editmap',
  templateUrl: './editmap.component.html',
  styleUrls: ['./editmap.component.scss']
})
export class EditmapComponent extends BaseMapComponent {

  private editShop: Shop;

  constructor(private snackBar: MatSnackBar, private placeService: PlacesService, locationService: ShopService, router: Router, componentFactoryResolver: ComponentFactoryResolver, renderer: Renderer2) {
    super(locationService, router, componentFactoryResolver, renderer);
    if (router?.getCurrentNavigation()?.extras?.state) {
      let state = router?.getCurrentNavigation()?.extras.state as RouterExtra;
      this.editShop = state.payload;
    }
  }

  @ViewChild('infoContainer', { static: false }) infowindowContent: ElementRef;
  @ViewChild('infoContent', { static: false }) contentChild: EditContentComponent;
  @ViewChild('clickContainer', { read: ViewContainerRef }) clickWindowContent: ViewContainerRef;
  infowindow: google.maps.InfoWindow;

  ngAfterViewInit() {
    super.ngAfterViewInit();
    setTimeout(() => {
      if (this.editShop) {
        this.markerClick(this.editShop);
        this.editShop = null;
      }
    }, 0);
  }

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
    this.contentChild.setAddShopCallback((shop) => me.cluster.addMarker(me.addShopMarker(shop)));
    this.contentChild.setUpdateShopCallback((shop) => { /* TODO: */ })
    this.map.addListener('click', (event) => me.poiClick(event));
    this.map.addListener('rightclick', (event) => me.rightClick(event));
    google.maps.event.addListener(this.infowindow, 'closeclick', () => me.contentChild.reset());
  }

  composeMarker(marker: google.maps.Marker, shop: Shop) {
    const me = this;
    google.maps.event.addDomListener(marker, 'rightclick', () => me.markerClick(shop)); // TODO: Overlay?
    google.maps.event.addDomListener(marker, 'click', () => me.markerClick(shop));
  }

  private rightClick(event) {
    this.showOverlay(
      "Shop hinzufügen",
      () => {
        this.closeOverlay();
        this.map.setZoom(Math.max(16, this.map.getZoom()));
        this.map.panTo(event.latLng);
        this.snackBar.open(`Um einen Shop hinzuzufügen klicke auf einen Maps Eintrag!`, "Ok", {
          duration: 6000,
        });
      },
      event,
      this.clickWindowContent,
    );
  }

  private markerClick(shop: Shop) {
    this.infowindow.setPosition(new google.maps.LatLng(shop.lat, shop.lon));
    this.infowindow.open(this.map);
    this.contentChild.setShop(shop);
  }

  private poiClick(event: any) {
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
