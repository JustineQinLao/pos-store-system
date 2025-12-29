import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { EncryptionService } from './services/encryption.service';
import { AuthService } from './services/auth.service';
import { NavbarComponent } from './components/navbar/navbar.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NavbarComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'pos-store';

  constructor(
    private encryptionService: EncryptionService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // Encryption settings already loaded by APP_INITIALIZER
    // Just check auth status
    this.authService.checkAuthStatus();
  }
}
