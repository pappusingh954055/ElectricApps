import { Component, Inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common'; // Import CommonModule
import { MaterialModule } from '../../../../shared/material/material/material-module';
import { POService } from '../../service/po.service';

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
        @Inject(MAT_DIALOG_DATA) public data: any,
        private poService: POService,
        private cdr: ChangeDetectorRef
    ) { }

    public isLoading: boolean = false;

    ngOnInit(): void {
        // Debugging to see what structure we actually get
        console.log('PO Print Data:', this.data);
    }

    print(): void {
        window.print();
    }

    downloadPDF(): void {
        console.log('Download triggered for ID:', this.data?.id);
        if (!this.data?.id) {
            console.error('Missing ID in data');
            return;
        }

        this.isLoading = true; // Start loader
        this.poService.downloadPOReport(this.data.id).subscribe({
            next: (blob: Blob) => {
                this.isLoading = false; // Stop loader
                // Angular sometimes misses this change if it happens outside its zone or too fast
                this.cdr.detectChanges();

                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `PO-${this.data.poNumber || 'Report'}.pdf`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
                console.log('Download initiated successfully');
            },
            error: (err) => {
                this.isLoading = false; // Stop loader on error
                this.cdr.detectChanges();
                console.error('Download failed', err);
            }
        });
    }

    close(): void {
        this.dialogRef.close();
    }
}
