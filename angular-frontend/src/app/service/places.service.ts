import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class PlacesService {

  private service: google.maps.places.PlacesService;

  constructor() { }

  init(map) {
    this.service = new google.maps.places.PlacesService(map);
  }

  getInformation(placeId, callback) {
    this.service.getDetails({ placeId: placeId }, callback);
  }

}
