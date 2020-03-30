import { Shop } from 'src/app/models/dto';


export interface MapDecorator {
  composeMarker(marker: google.maps.Marker, shop: Shop);
  mapInited(payload: any): void;
  showShop(shop: Shop);
  showPlace(place: google.maps.places.PlaceResult);
  getMapStyles(): google.maps.MapTypeStyle[];
  dispose(): void;
}
