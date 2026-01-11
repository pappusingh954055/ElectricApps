import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';

import { MaterialModule } from '../../../shared/material/material/material-module';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ApiResultDialogData } from '../api-result-dialog.model';


// export interface ApiResultDialogData {
//   success: boolean;
//   title: string;
//   message: string;
//   payload?: any;
// }


@Component({
  selector: 'app-api-result-dialog',
  imports: [CommonModule, MaterialModule],
  templateUrl: './api-result-dialog.html',
  styleUrl: './api-result-dialog.scss',
})
export class ApiResultDialog {
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: ApiResultDialogData,
    private dialogRef: MatDialogRef<ApiResultDialog>
  ) { }

  close() {
    this.dialogRef.close();
  }
}
