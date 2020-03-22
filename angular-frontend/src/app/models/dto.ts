export interface Healthy {
  healthy: boolean;
}

export interface ErrorMsg {
  msg: string;
}

export interface Shop {
  title: string;
  url: string;
  descr: string;
  lon: number;
  lat: number;
}

export interface ShopResponse {
  items: Array<Shop>
}

export interface InsertShopReq {
  title: string;
  url: string;
  descr: string;
  lon: number;
  lat: number;
}
