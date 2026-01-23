import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnDestroy, Output } from '@angular/core';
import { MaterialModule } from '../../material/material/material-module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms'; // FormsModule add kiya
import { Subject, Subscription, debounceTime, distinctUntilChanged } from 'rxjs';

@Component({
  selector: 'app-search-input',
  standalone: true, // Standalone check karein
  imports: [CommonModule, MaterialModule, ReactiveFormsModule, FormsModule], // FormsModule zaroori hai
  templateUrl: './app-search-input.html',
  styleUrl: './app-search-input.scss',
})
export class AppSearchInput implements OnDestroy {
  @Input() label: string = 'Search...';
  @Input() placeholder: string = 'Type to search';
  @Input() value: string = '';
  @Output() onSearch = new EventEmitter<string>();

  private searchSubject = new Subject<string>();
  private subscription: Subscription;

  constructor() {
    // Yeh subscription tabhi chalega jab aap searchSubject.next() use karenge
    this.subscription = this.searchSubject.pipe(
      debounceTime(500),
      distinctUntilChanged()
    ).subscribe(val => {
      console.log('Debounced value emitting:', val);
      this.onSearch.emit(val);
    });
  }

  onKeyUp() {
    // Galati yahan thi: direct emit karne se debounce bypass ho raha tha
    // Ab hum subject mein value bhejenge
    this.searchSubject.next(this.value.trim());
  }

  clear() {
    this.value = '';
    this.searchSubject.next(''); // Clear par bhi subject bhejein
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
}