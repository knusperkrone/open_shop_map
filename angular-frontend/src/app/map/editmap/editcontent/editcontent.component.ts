import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { Shop } from 'src/app/models/dto';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { LocationService } from 'src/app/service/location.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-editcontent',
  templateUrl: './editcontent.component.html',
  styleUrls: ['./editcontent.component.scss']
})
export class EditContentComponent implements OnInit {

  insertGroup: FormGroup;

  place: any;
  shop: Shop;
  // Callbacks
  private close: () => void;
  private addShop: (Shop) => void;
  private updateShop: (Shop) => void;

  constructor(private locationService: LocationService, private snackBar: MatSnackBar) { }

  ngOnInit(): void {
    this.insertGroup = new FormGroup({
      'url': new FormControl(null, [Validators.required]),
      'coupon': new FormControl(false),
    });
  }

  url() {
    return this.insertGroup.get('url');
  }

  getErrorMessage() {
    if (this.url().hasError('required')) {
      return 'Die Shop URL fehlt noch!';
    }
    return '';
  }

  setAddShopCallback(addShop: (Shop) => void) {
    this.addShop = addShop;
  }

  setCloseCallback(close: () => void) {
    this.close = close;
  }

  reset() {
    this.place = null;
    this.shop = null;
    this.insertGroup.reset();
  }

  abort() {
    this.close();
  }

  submit() {
    if (this.insertGroup.touched && this.insertGroup.valid) {
      let request: Observable<Shop>;
      let msg: string;
      if (this.shop != null) {
        const url = this.normalizeUrl(this.url().value);
        request = this.locationService.updateLocation(this.shop);
        msg = "geupdated";
      } else {
        const geometry: google.maps.LatLng = this.place.geometry.location;
        const url = this.normalizeUrl(this.url().value);
        request = this.locationService.insertLocation(geometry.lng(), geometry.lat(), this.place.name, url, "")
        msg = "eingtragen";
      }

      request.subscribe(
        (shop: Shop) => {
          if (this.shop == null) {
            this.addShop(shop);
          } else {
            this.updateShop(shop);
          }
          this.insertGroup.reset();
          this.snackBar.open(`Dein Shop wurde ${msg} - Danke!`, "Ok", {
            duration: 2000,
          });
          this.close();
        },
        (msg) => {
          let err = msg?.error?.msg ?? JSON.stringify(msg);
          this.snackBar.open("Da ist was schiefgelaufen: " + err, "Ok", {
            duration: 8000,
          });
        }
      )
    }
  }

  setPlace(place) {
    this.reset();
    this.shop = null;
    this.place = place;

    document.getElementById('place-name').textContent = place.name;
  }


  setShop(shop: Shop) {
    this.reset();
    this.place = null;
    this.shop = shop;

    document.getElementById('place-name').textContent = shop.title;
    this.url().setValue(shop.url);
  }

  private normalizeUrl(url: string): string {
    if (!url.startsWith("http://") || !url.startsWith("https://")) {
      return "http://" + url;
    }
    return url;
  }

}
