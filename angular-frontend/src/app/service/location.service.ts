import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ShopResponse, InsertShopReq, Shop } from '../models/dto';
import { ApiConfig } from './config';


@Injectable({
  providedIn: 'root'
})
export class ShopService {

  private cachedArea: google.maps.LatLngBounds;

  constructor(private http: HttpClient) { }

  getShops(center: google.maps.LatLng, bounds: google.maps.LatLngBounds): Observable<ShopResponse> {
    let range = ApiConfig.RANGE_M;
    if (bounds) {
      // determine zoom level and increase range
      let ne = bounds.getNorthEast();
      let c = bounds.getCenter();
      range = google.maps.geometry.spherical.computeDistanceBetween(ne, c);
      range += range / 5 * 3; // increase search area

      range = Math.trunc(range);
      range = Math.max(range, ApiConfig.RANGE_M);
    }


    let ne = google.maps.geometry.spherical.computeOffset(center, range / 2, 0);
    ne = google.maps.geometry.spherical.computeOffset(ne, range / 2, 90);
    const se = google.maps.geometry.spherical.computeOffset(ne, range, 180);
    const sw = google.maps.geometry.spherical.computeOffset(se, range, 270);
    //const nw = google.maps.geometry.spherical.computeOffset(sw, range, 0);
    this.cachedArea = new google.maps.LatLngBounds(sw, ne)

    return this.http.get(`${ApiConfig.BASE_URL}api/shop?lon=${center.lng()}&lat=${center.lat()}&range=${range.toFixed(0)}`) as Observable<ShopResponse>;
  }

  insertShops(lon: number, lat: number, title: string, url: string, descr: string) {
    const req: InsertShopReq = {
      lon: lon,
      lat: lat,
      title: title,
      url: url,
      descr: descr,
    };
    return this.http.post(`${ApiConfig.BASE_URL}api/shop`, req) as Observable<Shop>;
  }

  updateShops(shop: Shop) {
    const req: InsertShopReq = {
      lon: shop.lon,
      lat: shop.lat,
      title: shop.title,
      url: shop.url,
      descr: shop.descr,
    };
    return this.http.put(`${ApiConfig.BASE_URL}api/shop`, req) as Observable<Shop>;
  }

  updatedViewArea(area: google.maps.LatLngBounds): boolean {
    if (!this.cachedArea.contains(area.getNorthEast())) {
      return true;
    } else if (!this.cachedArea.contains(area.getSouthWest())) {
      return true;
    }
    return false;
  }

}
