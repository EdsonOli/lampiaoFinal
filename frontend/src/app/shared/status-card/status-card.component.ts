import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-status-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './status-card.component.html',
  styleUrl: './status-card.component.css',
})
export class StatusCardComponent {
  @Input() kicker = '';
  @Input() message = '';
  @Input() variant: 'default' | 'error' | 'empty' = 'default';
}
