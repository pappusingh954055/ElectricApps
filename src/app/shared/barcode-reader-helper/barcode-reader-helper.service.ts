
import { Injectable, OnDestroy } from '@angular/core';
import { Subject, Subscription, fromEvent } from 'rxjs';
import { buffer, debounceTime, filter, map } from 'rxjs/operators';

/**
 * 🛠️ BarcodeReaderHelper
 * Handles global keyboard events to detect rapid typing typical of barcode scanners.
 */
@Injectable({ providedIn: 'root' })
export class BarcodeReaderHelper implements OnDestroy {
  private keyStroke$ = new Subject<KeyboardEvent>();
  private scanSubject = new Subject<string>();
  private subscription: Subscription;

  // Configuration
  private readonly DEBOUNCE_TIME = 50; // Milliseconds between keys
  private readonly MIN_LENGTH = 3;     // Minimum length of a barcode

  constructor() {
    // Listen to all keydown events on the window
    this.subscription = fromEvent<KeyboardEvent>(window, 'keydown')
      .pipe(
        // Ignore events from focused inputs/textareas to prevent conflict, 
        // unless we want global scanning (which we usually do for scanners)
        // For now, we allow global but filters out common control keys
        filter(event => event.key.length === 1 || event.key === 'Enter')
      )
      .subscribe(event => this.keyStroke$.next(event));

    // Logic to buffer keys: if they come fast enough, it's a barcode
    this.keyStroke$.pipe(
      buffer(this.keyStroke$.pipe(debounceTime(this.DEBOUNCE_TIME))),
      map(events => {
        const keys = events.map(e => e.key);
        // If the last key is 'Enter', it's often the scanner suffix
        if (keys[keys.length - 1] === 'Enter') {
          keys.pop();
        }
        return keys.join('');
      }),
      filter(code => code.length >= this.MIN_LENGTH)
    ).subscribe(code => {
      this.scanSubject.next(code);
    });
  }

  /**
   * 📡 Returns an observable that emits the scanned barcode string
   */
  onScan() {
    return this.scanSubject.asObservable();
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
}
