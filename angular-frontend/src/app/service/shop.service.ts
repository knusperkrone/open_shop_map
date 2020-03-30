import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ShopResponse, InsertShopReq, Shop } from '../models/dto';
import { environment } from '../../environments/environment';


@Injectable({
  providedIn: 'root'
})
export class ShopService {

  private cachedArea: google.maps.LatLngBounds;
  private cachedShops: Array<Shop>;
  viewArea: google.maps.LatLngBounds;

  constructor(private http: HttpClient) { }

  getShops(center: google.maps.LatLng, bounds: google.maps.LatLngBounds): Observable<ShopResponse> {
    let range = this.calcRange(bounds);

    let ne = google.maps.geometry.spherical.computeOffset(center, range / 2, 0);
    ne = google.maps.geometry.spherical.computeOffset(ne, range / 2, 90);
    const se = google.maps.geometry.spherical.computeOffset(ne, range, 180);
    const sw = google.maps.geometry.spherical.computeOffset(se, range, 270);
    //const nw = google.maps.geometry.spherical.computeOffset(sw, range, 0);
    this.cachedArea = new google.maps.LatLngBounds(sw, ne)

    let shops = this.http.get(`${environment.baseUrl}api/shop?lon=${center.lng()}&lat=${center.lat()}&range=${range.toFixed(0)}`) as Observable<ShopResponse>;
    shops.subscribe((resp) => this.cachedShops = resp.items);
    return shops;
  }

  searchShopsInArea(name: string): Observable<ShopResponse> {
    let center = this.viewArea.getCenter();
    let range = this.calcRange(this.viewArea);
    let q = encodeURIComponent(name);
    return this.http.get(`${environment.baseUrl}api/shop?q=${q}&lon=${center.lng()}&lat=${center.lat()}&range=${range.toFixed(0)}`) as Observable<ShopResponse>;
  }

  insertShops(lon: number, lat: number, title: string, url: string, donationUrl: string) {
    const req: InsertShopReq = {
      lon: lon,
      lat: lat,
      title: title,
      url: url,
      donationUrl: donationUrl,
    };
    return this.http.post(`${environment.baseUrl}api/shop`, req) as Observable<Shop>;
  }

  updateShops(shop: Shop) {
    const req: InsertShopReq = {
      lon: shop.lon,
      lat: shop.lat,
      title: shop.title,
      url: shop.url,
      donationUrl: shop.donationUrl,
    };
    return this.http.put(`${environment.baseUrl}api/shop`, req) as Observable<Shop>;
  }

  updatedViewArea(area: google.maps.LatLngBounds): boolean {
    this.viewArea = area;
    if (!this.cachedArea.contains(area.getNorthEast())) {
      return true;
    } else if (!this.cachedArea.contains(area.getSouthWest())) {
      return true;
    }
    return false;
  }

  containsPlace(place): Shop | null {
    const lat = place.geometry.location.lat();
    const lng = place.geometry.location.lng();
    for (const shop of this.cachedShops) {
      if (shop.title === place.name && shop.lat === lat && shop.lon == lng) {
        return shop;
      }
    }
    return null;
  }

  private calcRange(bounds: google.maps.LatLngBounds): number {
    let range = environment.defaultRange;
    if (bounds) {
      // determine zoom level and increase range
      let ne = bounds.getNorthEast();
      let c = bounds.getCenter();
      range = google.maps.geometry.spherical.computeDistanceBetween(ne, c);
      range += range / 5 * 3; // increase search area

      range = Math.trunc(range);
      range = Math.max(range, environment.defaultRange);
    }
    return range;
  }

}
