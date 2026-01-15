import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GlassCardComponent } from './glass-card.component';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule, GlassCardComponent],
  template: `
    @if (isOpen) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" (click)="closeModal.emit()"></div>
        <app-glass-card [class]="'relative w-full max-h-[90vh] overflow-hidden flex flex-col ' + sizeClass" [hover]="false">
          <div class="flex items-center justify-between p-5 border-b border-white/10">
            <h2 class="text-lg font-semibold text-white">{{ title }}</h2>
            <button (click)="closeModal.emit()" class="p-1 hover:bg-white/10 rounded-lg transition-colors">
              <svg class="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
          <div class="flex-1 overflow-y-auto p-5">
            <ng-content></ng-content>
          </div>
        </app-glass-card>
      </div>
    }
  `
})
export class ModalComponent {
  @Input() isOpen = false;
  @Input() title = '';
  @Input() size: 'sm' | 'md' | 'lg' | 'xl' = 'md';
  @Output() closeModal = new EventEmitter<void>();

  private sizes: Record<string, string> = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  get sizeClass(): string {
    return this.sizes[this.size];
  }
}
