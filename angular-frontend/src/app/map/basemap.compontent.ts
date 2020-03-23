import { AfterViewInit, ViewChild, ElementRef, ViewContainerRef, ComponentFactoryResolver, Renderer2 } from '@angular/core';
import { ShopService } from '../service/location.service';
import { Shop } from '../models/dto';
import { MapState, RouterExtra } from '../models/state';
import { Router } from '@angular/router';
import { ClickContentComponent } from './clickcontent/clickcontent.component';


export abstract class BaseMapComponent implements AfterViewInit {

  private overlay: google.maps.OverlayView;
  private prevState: MapState;

  constructor(protected locationService: ShopService, private router: Router, private componentFactoryResolver: ComponentFactoryResolver, private renderer: Renderer2) {
    if (this.router?.getCurrentNavigation()?.extras.state) {
      let state = this.router?.getCurrentNavigation()?.extras.state as RouterExtra;
      this.prevState = state.map;
    }
  }

  @ViewChild('mapContainer', { static: false }) gmap: ElementRef;
  map: google.maps.Map;
  cluster: MarkerClusterer;

  ngAfterViewInit(): void {
    if (this.prevState) {
      this.initMap(this.prevState.lat, this.prevState.lng, this.prevState.zoom);
    } else if (navigator.geolocation) {
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

  private geolocationFallback(msg: any) {
    if (msg) {
      console.log(msg);
    }
    this.initMap(51.138626, 10.292077, 7);
  }

  initMap(lat: number, lng: number, zoom: number = 14) {
    let mapOptions: google.maps.MapOptions = {
      center: new google.maps.LatLng(lat, lng),
      zoom: zoom,
      streetViewControl: false,
      fullscreenControl: false,
      styles: this.getMapStyles()
    };


    this.map = new google.maps.Map(this.gmap.nativeElement, mapOptions);
    this.map.addListener("dragstart", (_) => { this.overlay?.onRemove(); this.overlay = null });
    this.map.addListener("click", (_) => { this.overlay?.onRemove(); this.overlay = null });

    const me = this;
    google.maps.event.addListener(this.map, 'idle', () => {
      if (me.locationService.updatedViewArea(me.map.getBounds())) {
        me.fetchShops();
      }
    });

    // show clustered locations
    this.fetchShops();

    // lifecycle callback
    this.mapInited();
  }

  fetchShops() {
    const me = this;

    this.locationService.getShops(this.map.getCenter(), this.map.getBounds()).subscribe((resp) => {
      var markers = resp.items.map((shop) => me.addShopMarker(shop));

      // Add a marker clusterer to manage the markers.
      if (this.cluster) {
        this.cluster.clearMarkers();
        this.cluster.addMarkers(markers);
      } else {
        this.cluster = new MarkerClusterer(this.map, markers,
          { imagePath: 'https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/m' });
      }
    });
  }

  addShopMarker(shop: Shop): google.maps.Marker {
    const marker = new google.maps.Marker({
      position: new google.maps.LatLng(shop.lat, shop.lon),
      label: shop.title,
      clickable: true,
    });
    this.composeMarker(marker, shop);
    return marker;
  }

  navigate(path: string, data: any = undefined) {
    let center = this.map.getCenter();
    let mapState: MapState = {
      lat: center.lat(),
      lng: center.lng(),
      zoom: this.map.getZoom(),
    };

    let extra: RouterExtra = {
      map: mapState,
      payload: data,
    };
    this.router.navigateByUrl(path, { state: extra });
  }

  showOverlay(msg: string, callback: VoidFunction, event: any, container: ViewContainerRef) {
    this.overlay?.onRemove();
    this.overlay = new ClickContextMenuOverlay(
      msg,
      callback,
      event,
      container,
      this.componentFactoryResolver,
      this.renderer,
    );
    this.overlay.setMap(this.map);
  }

  closeOverlay() {
    this.overlay?.onRemove();
    this.overlay = null;
  }

  abstract composeMarker(marker: google.maps.Marker, shop: Shop);
  abstract mapInited();
  abstract getMapStyles(): google.maps.MapTypeStyle[];
}


class ClickContextMenuOverlay extends google.maps.OverlayView {

  private ref: any;

  constructor(private msg: string, private callback: VoidFunction, private event: any, private containerRef: ViewContainerRef, private componentFactoryResolver: ComponentFactoryResolver, private renderer: Renderer2) {
    super();
  }

  onAdd() {
    const componentFactory = this.componentFactoryResolver.resolveComponentFactory(ClickContentComponent);
    const componentRef = this.containerRef.createComponent(componentFactory);
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
    this.renderer.setStyle(element, "position", "absolute");
    this.renderer.setStyle(element, "left", pixel.x + 'px');
    this.renderer.setStyle(element, "top", (pixel.y) + 'px');
  };

  onRemove() {
    this.containerRef.remove(0);
  }

}
