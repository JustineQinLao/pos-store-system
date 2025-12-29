import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService, LoginData } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  loginData: LoginData = {
    username: '',
    password: ''
  };
  
  errorMessage: string = '';
  isLoading: boolean = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  onSubmit(): void {
    if (!this.loginData.username || !this.loginData.password) {
      this.errorMessage = 'Please fill in all fields';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.authService.login(this.loginData).subscribe({
      next: (response) => {
        this.isLoading = false;
        const user = response.user;
        
        console.log('Login successful:', user);
        
        // Redirect based on role
        if (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN') {
          this.router.navigate(['/admin']);
        } else if (user.role === 'CASHIER') {
          this.router.navigate(['/cashier']);
        } else {
          this.router.navigate(['/home']);
        }
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Login error:', error);
        
        if (error.status === 403 && error.error.is_verified === false) {
          this.errorMessage = 'Your account is pending verification by Super Admin';
        } else if (error.status === 401) {
          this.errorMessage = 'Invalid username or password';
        } else if (error.status === 0) {
          this.errorMessage = 'Cannot connect to server. Please check if the backend is running.';
        } else {
          this.errorMessage = error.error?.error || 'Login failed. Please try again.';
        }
      }
    });
  }
}
