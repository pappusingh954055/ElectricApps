import { Component, OnInit } from '@angular/core';
import { PriceList } from '../models/pricelist.model';
import { PriceListService } from '../service/pricelist.service';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { materialize } from 'rxjs';
import { MaterialModule } from '../../../../shared/material/material/material-module';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-pricelist-list',
  imports: [CommonModule, ReactiveFormsModule, MaterialModule, RouterLink],
  templateUrl: './pricelist-list.html',
  styleUrl: './pricelist-list.scss',
})
export class PricelistList implements OnInit {

  displayedColumns = ['name', 'type', 'effectiveFrom', 'status', 'actions'];
  priceLists: PriceList[] = [];

  constructor(private service: PriceListService) {}

  ngOnInit() {
    this.priceLists = this.service.getPriceLists();
  }
}