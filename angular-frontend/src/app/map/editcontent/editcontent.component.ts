import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { Shop } from 'src/app/models/dto';
import { FormGroup, FormControl, Validators, ValidatorFn } from '@angular/forms';
import { ShopService } from 'src/app/service/shop.service';
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
  title: string;
  // Callbacks
  private close: () => void;
  private addShop: (Shop) => void;
  private updateShop: (Shop) => void;

  constructor(public shopService: ShopService, public snackBar: MatSnackBar) { }

  ngOnInit(): void {
    this.insertGroup = new FormGroup({
      'url': new FormControl(this.shop?.url),
      'donationUrl': new FormControl(this.shop?.donationUrl),
    }, this.validateForm());
  }

  url() {
    return this.insertGroup?.get('url');
  }

  donationUrl() {
    return this.insertGroup?.get('donationUrl');
  }

  getErrorMessage() {
    return 'Eine Url muss eingetragen werden';
  }

  setAddShopCallback(addShop: (Shop) => void) {
    this.addShop = addShop;
  }

  setUpdateShopCallback(updateShop: (Shop) => void) {
    this.updateShop = updateShop;
  }

  setCloseCallback(close: () => void) {
    this.close = close;
  }

  reset() {
    this.place = null;
    this.shop = null;
    this.insertGroup?.reset();
  }

  abort() {
    this.close();
  }

  submit() {
    if (this.insertGroup.valid) {
      let request: Observable<Shop>;
      let msg: string;
      if (this.shop != null) {
        this.shop.url = this.normalizeUrl(this.url().value);
        this.shop.donationUrl = this.normalizeUrl(this.donationUrl().value);
        request = this.shopService.updateShops(this.shop);
        msg = 'geupdated';
      } else {
        const geometry: google.maps.LatLng = this.place.geometry.location;
        const url = this.normalizeUrl(this.url()?.value);
        const donationUrl = this.normalizeUrl(this.donationUrl()?.value);
        request = this.shopService.insertShops(geometry.lng(), geometry.lat(), this.place.name, url, donationUrl);
        msg = 'eingtragen';
      }

      request.subscribe(
        (shop: Shop) => {
          if (this.shop == null) {
            this.addShop(shop);
          } else {
            this.updateShop(shop);
          }
          this.insertGroup.reset();
          this.snackBar.open(`Dein Shop wurde ${msg} - Danke!`, 'Ok', {
            duration: 2000,
          });
          this.close();
        },
        (msg) => {
          let err = msg?.error?.msg ?? JSON.stringify(msg);
          this.snackBar.open('Da ist was schiefgelaufen: ' + err, 'Ok', {
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

    this.title = place.name;
  }


  setShop(shop: Shop) {
    this.reset();
    this.place = null;
    this.shop = shop;

    this.title = shop.title;
    this.url()?.setValue(shop.url);
  }

  private validateForm(): ValidatorFn {
    return (control) => {
      if (this.url() == null || this.donationUrl() == null) {
        // not inited
        return;
      }

      if (!this.url().value && !this.donationUrl().value) {
        this.url().setErrors({ requiredUrl: true });
        this.donationUrl().setErrors({ requiredDonate: true });
      } else {
        this.url().setErrors(null);
        this.donationUrl().setErrors(null);
      }
      return null;
    }
  }

  private normalizeUrl(url: string): string {
    if (!url) {
      return null
    } else if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return 'http://' + url;
    }
    return url;
  }

}
