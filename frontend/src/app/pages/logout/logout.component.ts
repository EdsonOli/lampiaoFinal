import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-logout',
  standalone: true,
  template: '',
})
export class LogoutComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);

  ngOnInit(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
