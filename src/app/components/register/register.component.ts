import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService, RegisterData } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {
  registerData: RegisterData = {
    username: '',
    email: '',
    password: '',
    password_confirm: '',
    first_name: '',
    last_name: '',
    phone_number: '',
    role: 'CUSTOMER'
  };
  
  errorMessage: string = '';
  successMessage: string = '';
  isLoading: boolean = false;

  roles = [
    { value: 'CUSTOMER', label: 'Customer' },
    { value: 'CASHIER', label: 'Cashier' },
    { value: 'ADMIN', label: 'Admin' }
  ];

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  onSubmit(): void {
    // Validation
    if (!this.registerData.username || !this.registerData.email || 
        !this.registerData.password || !this.registerData.password_confirm ||
        !this.registerData.first_name || !this.registerData.last_name) {
      this.errorMessage = 'Please fill in all required fields';
      return;
    }

    if (this.registerData.password !== this.registerData.password_confirm) {
      this.errorMessage = 'Passwords do not match';
      return;
    }

    if (this.registerData.password.length < 8) {
      this.errorMessage = 'Password must be at least 8 characters long';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.authService.register(this.registerData).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.successMessage = response.message || 'Registration successful! Your account is pending verification by Super Admin.';
        
        console.log('Registration successful:', response);
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 3000);
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Registration error:', error);
        
        if (error.status === 0) {
          this.errorMessage = 'Cannot connect to server. Please check if the backend is running.';
        } else if (error.error?.email) {
          this.errorMessage = error.error.email[0];
        } else if (error.error?.username) {
          this.errorMessage = error.error.username[0];
        } else if (error.error?.password) {
          this.errorMessage = error.error.password[0];
        } else {
          this.errorMessage = 'Registration failed. Please try again.';
        }
      }
    });
  }
}
