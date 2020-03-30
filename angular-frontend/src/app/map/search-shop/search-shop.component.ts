import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Subject } from 'rxjs';
import { Shop } from 'src/app/models/dto';
import { ShopService } from 'src/app/service/shop.service';

@Component({
  selector: 'app-search-shop',
  templateUrl: './search-shop.component.html',
  styleUrls: ['./search-shop.component.scss']
})
export class SearchShopComponent implements OnInit {

  searchControl: FormControl;
  searchedShops: Subject<Array<Shop>>;

  @Output() shop: EventEmitter<Shop> = new EventEmitter();

  constructor(private serivce: ShopService) { }

  ngOnInit(): void {
    this.searchedShops = new Subject();
    this.searchControl = new FormControl();
    this.searchControl.valueChanges.subscribe((value: string) => {
      if (value && value.length <= 2) {
        this.searchedShops.next([]);
      } else {
        this.serivce.searchShopsInArea(value).subscribe((resp) => {
          this.searchedShops.next(resp.items);
        });
      }
    });
  }

  emitShop(shop: Shop) {
    this.shop.next(shop);
  }

}
