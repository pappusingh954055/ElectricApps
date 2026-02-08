import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common'; // Import CommonModule
import { MaterialModule } from '../../../../shared/material/material/material-module';

@Component({
    selector: 'app-po-print-modal',
    standalone: true,
    imports: [CommonModule, MaterialModule], // Add CommonModule here
    providers: [DatePipe, CurrencyPipe],
    templateUrl: './po-print-modal.component.html',
    styleUrls: ['./po-print-modal.component.scss']
})
export class PoPrintModalComponent implements OnInit {

    constructor(
        public dialogRef: MatDialogRef<PoPrintModalComponent>,
        @Inject(MAT_DIALOG_DATA) public data: any
    ) { }

    ngOnInit(): void {
        // Debugging to see what structure we actually get
        console.log('PO Print Data:', this.data);
    }

    print(): void {
        window.print();
    }

    close(): void {
        this.dialogRef.close();
    }
}
