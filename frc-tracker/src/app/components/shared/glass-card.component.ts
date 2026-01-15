import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-glass-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      [class]="getCardClass()"
      [class.cursor-pointer]="clickable"
    >
      @if (glow) {
        <div class="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-cyan-500/10 pointer-events-none"></div>
      }
      <ng-content></ng-content>
    </div>
  `
})
export class GlassCardComponent {
  @Input() hover = true;
  @Input() glow = false;
  @Input() clickable = false;
  @Input() class = '';

  getCardClass(): string {
    let classes = `relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] backdrop-blur-xl border border-white/[0.08]`;

    if (this.hover) {
      classes += ' hover:border-white/20 hover:from-white/[0.12] hover:to-white/[0.04] transition-all duration-300';
    }

    if (this.glow) {
      classes += ' shadow-lg shadow-purple-500/10';
    }

    if (this.class) {
      classes += ' ' + this.class;
    }

    return classes;
  }
}
