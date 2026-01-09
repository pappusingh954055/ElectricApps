import { Injectable } from '@angular/core';
import { PriceList, PriceListItem } from '../models/pricelist.model';


@Injectable({ providedIn: 'root' })
export class PriceListService {

  priceLists: PriceList[] = [];
  items: PriceListItem[] = [];

  getPriceLists() {
    return this.priceLists;
  }

  addPriceList(pl: PriceList) {
    pl.id = Date.now();
    this.priceLists.push(pl);
  }

  getItems(priceListId: number) {
    return this.items.filter(i => i.priceListId === priceListId);
  }

  addItem(item: PriceListItem) {
    item.id = Date.now();
    this.items.push(item);
  }
}
