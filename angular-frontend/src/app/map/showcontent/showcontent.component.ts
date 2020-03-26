import { Component, OnInit } from '@angular/core';
import { Shop } from 'src/app/models/dto';

@Component({
  selector: 'app-showcontent',
  templateUrl: './showcontent.component.html',
  styleUrls: ['./showcontent.component.scss']
})
export class ShowContentComponent {

  private shop: Shop;

  constructor() { }

  getLink(): string {
    if (this.shop) {
      return this.shop.url;
    }
  }

  setShop(shop: Shop) {
    this.shop = shop;
    document.getElementById('place-name').textContent = shop.title;
  }

}
