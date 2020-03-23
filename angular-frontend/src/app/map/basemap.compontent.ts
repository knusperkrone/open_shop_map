import { AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { LocationService } from '../service/location.service';
import { Shop } from '../models/dto';
import { MapState } from '../models/state';
import { Router } from '@angular/router';


export abstract class BaseMapComponent implements AfterViewInit {

  private lat: number;
  private lng: number;
  private zoom: number;

  constructor(protected locationService: LocationService, private router: Router) {
    // Get previous mapState
    if (this.router?.getCurrentNavigation()?.extras.state) {
      const state = this.router?.getCurrentNavigation()?.extras.state as MapState;
      this.lat = state.lat;
      this.lng = state.lng;
      this.zoom = state.zoom;
    }
  }

  @ViewChild('mapContainer', { static: false }) gmap: ElementRef;
  map: google.maps.Map;
  cluster: MarkerClusterer;

  ngAfterViewInit(): void {
    if (this.lat && this.lng && this.zoom) {
      this.initMap(this.lat, this.lng, this.zoom);
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
    this.initMap(51.138626, 10.292077);
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

    this.locationService.getLocations(this.map.getCenter(), this.map.getBounds()).subscribe((resp) => {
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

  navigate(path: string) {
    let center = this.map.getCenter();
    this.router.navigateByUrl(path, {
      state: {
        lat: center.lat(),
        lng: center.lng(),
        zoom: this.map.getZoom(),
      }
    });
  }

  abstract composeMarker(marker: google.maps.Marker, shop: Shop);
  abstract mapInited();
  abstract getMapStyles(): google.maps.MapTypeStyle[];

}
