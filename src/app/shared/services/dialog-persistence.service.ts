import { Injectable, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { StatusDialogComponent } from '../components/status-dialog-component/status-dialog-component';

const DIALOG_KEY = 'pendingStatusDialog';

/**
 * Service to persist dialog state across page refreshes.
 * When a StatusDialog is opened via this service:
 *  - Data is saved to sessionStorage
 *  - On page refresh, App checks and re-opens the dialog
 *  - Only cleared when user clicks OK/button (afterClosed)
 */
@Injectable({ providedIn: 'root' })
export class DialogPersistenceService {
    private dialog = inject(MatDialog);

    /**
     * Open a StatusDialog that persists across page refreshes.
     * Use this instead of dialog.open(StatusDialogComponent, ...) for important success/error dialogs.
     */
    openPersistent(data: any) {
        this._saveState(data);
        return this._openAndClear(data);
    }

    /**
     * Called on app init — re-opens dialog if a saved state exists (after refresh).
     */
    checkAndRestore() {
        const saved = sessionStorage.getItem(DIALOG_KEY);
        if (!saved) return;
        try {
            const data = JSON.parse(saved);
            this._openAndClear(data);
        } catch {
            sessionStorage.removeItem(DIALOG_KEY);
        }
    }

    clearState() {
        sessionStorage.removeItem(DIALOG_KEY);
    }

    private _saveState(data: any) {
        try {
            sessionStorage.setItem(DIALOG_KEY, JSON.stringify(data));
        } catch { /* ignore quota errors */ }
    }

    private _openAndClear(data: any) {
        const ref = this.dialog.open(StatusDialogComponent, {
            data,
            disableClose: true
        });
        ref.afterClosed().subscribe(() => {
            sessionStorage.removeItem(DIALOG_KEY);
        });
        return ref;
    }
}
