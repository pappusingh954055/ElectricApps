import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OutwardGatePassComponent } from './outward-gate-pass.component';
import { GatePassService } from '../services/gate-pass.service';
import { SaleOrderService } from '../../service/saleorder.service';
import { PurchaseReturnService } from '../../purchase-return/services/purchase-return.service';
import { AuthService } from '../../../../core/services/auth.service';
import { LoadingService } from '../../../../core/services/loading.service';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { MaterialModule } from '../../../../shared/material/material/material-module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { vi, describe, it, expect, beforeEach } from 'vitest';

describe('OutwardGatePassComponent', () => {
    let component: OutwardGatePassComponent;
    let fixture: ComponentFixture<OutwardGatePassComponent>;
    let gatePassServiceSpy: any;
    let saleOrderServiceSpy: any;
    let purchaseReturnServiceSpy: any;
    let authServiceSpy: any;
    let loadingServiceSpy: any;
    let dialogSpy: any;

    beforeEach(async () => {
        gatePassServiceSpy = {
            getGatePass: vi.fn(),
            createGatePass: vi.fn()
        };
        saleOrderServiceSpy = {
            getPendingSOs: vi.fn().mockReturnValue(of([]))
        };
        purchaseReturnServiceSpy = {
            getPendingPRs: vi.fn().mockReturnValue(of([]))
        };
        authServiceSpy = {
            getUserName: vi.fn().mockReturnValue('Test User')
        };
        loadingServiceSpy = {
            setLoading: vi.fn()
        };
        dialogSpy = {
            open: vi.fn()
        };

        await TestBed.configureTestingModule({
            imports: [
                OutwardGatePassComponent,
                ReactiveFormsModule,
                RouterTestingModule,
                MaterialModule,
                BrowserAnimationsModule
            ],
            providers: [
                { provide: GatePassService, useValue: gatePassServiceSpy },
                { provide: SaleOrderService, useValue: saleOrderServiceSpy },
                { provide: PurchaseReturnService, useValue: purchaseReturnServiceSpy },
                { provide: AuthService, useValue: authServiceSpy },
                { provide: LoadingService, useValue: loadingServiceSpy },
                { provide: MatDialog, useValue: dialogSpy },
                {
                    provide: ActivatedRoute,
                    useValue: {
                        queryParams: of({})
                    }
                }
            ]
        })
            .compileComponents();

        fixture = TestBed.createComponent(OutwardGatePassComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should load pending SOs on init', () => {
        expect(saleOrderServiceSpy.getPendingSOs).toHaveBeenCalled();
    });

    it('should load pending PRs on init', () => {
        expect(purchaseReturnServiceSpy.getPendingPRs).toHaveBeenCalled();
    });
});
