import { Component, EventEmitter, HostListener, Input, Output } from '@angular/core';
import { MaterialModule } from '../../../shared/material/material/material-module';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'form-footer',
  imports: [MaterialModule, CommonModule],
  templateUrl: './form-footer.html',
  styleUrl: './form-footer.scss',
})
export class FormFooter {

  @Input() loading = false;

  @Output() save = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  // 🔹 ENTER = SAVE
  @HostListener('document:keydown.enter', ['$event'])
  onEnter(event: Event) {
    const keyboardEvent = event as KeyboardEvent;

    if (this.loading) return;

    keyboardEvent.preventDefault();
    this.save.emit();
  }

  // 🔹 ESC = CANCEL
  @HostListener('document:keydown.escape', ['$event'])
  onEscape(event: Event) {
    const keyboardEvent = event as KeyboardEvent;

    keyboardEvent.preventDefault();
    this.cancel.emit();
  }
}
