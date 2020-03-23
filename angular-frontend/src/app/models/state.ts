import { Shop } from './dto';

export interface MapState {
  lat: number,
  lng: number,
  zoom: number,
}

export interface RouterExtra {
  map: MapState;
  payload: any;
}
