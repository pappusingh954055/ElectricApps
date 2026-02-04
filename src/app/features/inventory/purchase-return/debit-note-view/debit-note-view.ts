import { Component, inject } from '@angular/core';
import { MaterialModule } from '../../../../shared/material/material/material-module';
import { CommonModule } from '@angular/common';
import { PurchaseReturnService } from '../services/purchase-return.service';

@Component({
  selector: 'app-debit-note-view',
  imports: [MaterialModule, CommonModule],
  templateUrl: './debit-note-view.html',
  styleUrl: './debit-note-view.scss',
})
export class DebitNoteView {

  
}
