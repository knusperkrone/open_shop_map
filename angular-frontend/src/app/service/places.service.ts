import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class PlacesService {

  private serivce: google.maps.places.PlacesService;

  constructor() { }

  init(map) {
    this.serivce = new google.maps.places.PlacesService(map);
  }

  getInformation(placeId, callback) {
    this.serivce.getDetails({ placeId: placeId }, callback);
  }

}
