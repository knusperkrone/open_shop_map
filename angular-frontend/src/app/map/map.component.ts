import { Component, ViewChild, ElementRef, AfterViewInit, ComponentFactoryResolver, ViewContainerRef, Renderer2, OnInit } from '@angular/core';
import { ShopService } from '../service/shop.service';
import { Shop } from '../models/dto';
import { Router, ActivatedRoute } from '@angular/router';
import { ClickContentComponent } from './clickcontent/clickcontent.component';
import { MapDecorator } from './mapdecorator/mapdecorator';
import { ShowMapDecorator } from './mapdecorator/showmapdecorator';
import { PlacesService } from 'src/app/service/places.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { EditMapDecorator } from './mapdecorator/editmapdecorator';
import { environment } from 'src/environments/environment';


@Component({
  selector: 'app-showmap',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss']
})
export class MapComponent implements AfterViewInit, OnInit {

  @ViewChild('mapContainer', { static: false }) gmap: ElementRef;
  map: google.maps.Map;
  cluster: MarkerClusterer;

  @ViewChild('infoContainer', { static: false }) private infoWindowContainer: ElementRef;
  @ViewChild('infoContent', { read: ViewContainerRef }) infoWindowChild: ViewContainerRef;
  @ViewChild('clickContent', { read: ViewContainerRef }) clickWindowChild: ViewContainerRef;
  infowindow: google.maps.InfoWindow;
  decorator: MapDecorator;

  private overlay: google.maps.OverlayView;
  private isEditing = false;
  showTutorial: boolean;
  tabIndex: number = 0;

  constructor(public shopService: ShopService, public router: Router, public snackBar: MatSnackBar, public placeService: PlacesService, public componentFactoryResolver: ComponentFactoryResolver, public renderer: Renderer2) {
    this.router.routeReuseStrategy.shouldReuseRoute = function () {
      return false;
    };
    this.showTutorial = router.getCurrentNavigation().extras?.state?.showIntro ?? false;
  }

  ngOnInit(): void {
    this.decorator = new ShowMapDecorator(this);
    if (!localStorage.isNotFirstVisit || this.showTutorial) {
      this.showTutorial = true;
      localStorage.isNotFirstVisit = true;
    } else {
      this.showTutorial = false;
    }
  }

  ngAfterViewInit(): void {
    if (navigator.geolocation) {
      let me = this;
      navigator.geolocation.getCurrentPosition((position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        this.initMap(latitude, longitude);
      }, (e) => me.geolocationFallback(e));
    } else {
      this.geolocationFallback(null);
    }
  }

  initMap(lat: number, lng: number, zoom: number = 14) {
    this.infowindow = new google.maps.InfoWindow({
      content: this.infoWindowContainer.nativeElement,
      maxWidth: 240,
    });

    let mapOptions: google.maps.MapOptions = {
      center: new google.maps.LatLng(lat, lng),
      zoom: zoom,
      streetViewControl: false,
      fullscreenControl: false,
      zoomControl: true,
      mapTypeControl: false,
      styles: this.decorator.getMapStyles(),
    };
    this.map = new google.maps.Map(this.gmap.nativeElement, mapOptions);
    this.map.addListener("dragstart", (_) => { this.overlay?.onRemove(); this.overlay = null });
    this.map.addListener("click", (_) => { this.overlay?.onRemove(); this.overlay = null });
    this.placeService.init(this.map);

    const me = this;
    google.maps.event.addListener(this.map, 'idle', () => {
      if (me.shopService.updatedViewArea(me.map.getBounds())) {
        me.fetchShops();
      }
    });

    // show clustered locations
    this.fetchShops();

    // lifecycle callback
    this.decorator.mapInited(null);
  }

  fetchShops() {
    const me = this;

    this.shopService.getShops(this.map.getCenter(), this.map.getBounds()).subscribe((resp) => {
      var markers = resp.items.map((shop) => me.addShopMarker(shop));

      // Add a marker clusterer to manage the markers.
      if (this.cluster) {
        this.cluster.clearMarkers();
        this.cluster.addMarkers(markers);
      } else {
        this.cluster = new MarkerClusterer(this.map, markers,
          { imagePath: `${environment.assetsUrl}/cluster` });
      }
    });
  }

  addShopMarker(shop: Shop): google.maps.Marker {
    let icon: string = environment.assetsUrl;
    if (shop.donationUrl && shop.url) {
      icon += 'icon_store.png'
    } else if (shop.donationUrl) {
      icon += 'icon_donate.png'
    } else {
      icon += 'icon_shop.png'
    }
    const marker = new google.maps.Marker({
      position: new google.maps.LatLng(shop.lat, shop.lon),
      clickable: true,
      icon: icon,
    });
    (marker as any).__shop = shop;
    this.decorator.composeMarker(marker, shop);
    return marker;
  }

  switchMode(payload: any = null) {
    this.infowindow.close();
    this.decorator.dispose();
    if (this.isEditing) {
      this.decorator = new ShowMapDecorator(this);
    } else {
      this.decorator = new EditMapDecorator(this);
    }
    this.isEditing = !this.isEditing;

    this.decorator.mapInited(payload);
    this.cluster.getMarkers().forEach((m: any) => this.decorator.composeMarker(m, m.__shop));
    this.map.setOptions({ styles: this.decorator.getMapStyles() });
  }

  showOverlay(msg: string, event: any, callback: VoidFunction) {
    this.overlay?.onRemove();
    this.overlay = new ClickContextMenuOverlay(
      msg,
      event,
      callback,
      this,
    );
    this.overlay.setMap(this.map);
  }

  closeOverlay() {
    this.overlay?.onRemove();
    this.overlay = null;
  }

  /*
   * UI callbacks
   */

  onShop(shop: Shop) {
    this.gmap.nativeElement.focus();
    this.decorator.showShop(shop);
  }

  doShowTutorial() {
    this.showTutorial = true;
  }

  closeTutorial() {
    this.showTutorial = false;
  }

  changeTab(offset: number) {
    this.tabIndex += offset;
  }

  /*
   * Helpers
   */

  private geolocationFallback(msg: any) {
    if (msg) {
      console.log(msg);
    }
    this.initMap(51.138626, 10.292077, 7);
  }

}


class ClickContextMenuOverlay extends google.maps.OverlayView {

  private ref: any;

  constructor(private msg: string, private event: any, private callback: VoidFunction, private parent: MapComponent) {
    super();
  }

  onAdd() {
    const componentFactory = this.parent.componentFactoryResolver.resolveComponentFactory(ClickContentComponent);
    const componentRef = this.parent.clickWindowChild.createComponent(componentFactory);
    this.ref = componentRef;
    (<ClickContentComponent>componentRef.instance).msg = this.msg;
    (<ClickContentComponent>componentRef.instance).callback = this.callback;
  };

  draw() {
    let pixel;
    if (!this.event.pixel) {
      pixel = this.getProjection().fromLatLngToContainerPixel(this.event);
    } else {
      pixel = this.event.pixel;
      pixel.y += 54;
    }

    const element = this.ref.location.nativeElement;
    this.parent.renderer.setStyle(element, "position", "absolute");
    this.parent.renderer.setStyle(element, "left", pixel.x + 'px');
    this.parent.renderer.setStyle(element, "top", (pixel.y) + 'px');
  };

  onRemove() {
    this.parent.clickWindowChild.remove(0);
  }

}
