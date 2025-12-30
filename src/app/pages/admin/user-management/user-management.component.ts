import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../../../services/auth.service';

interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  is_super_admin?: boolean;
  is_admin?: boolean;
  is_cashier?: boolean;
  is_verified: boolean;
  date_joined: string;
  password?: string;
}

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user-management.component.html',
  styleUrl: './user-management.component.css'
})
export class UserManagementComponent implements OnInit {
  users: User[] = [];
  filteredUsers: User[] = [];
  currentUser: Partial<User> = {};
  loggedInUser: any = null;
  
  searchTerm = '';
  roleFilter = '';
  statusFilter = '';
  
  // Pagination
  currentPage = 1;
  itemsPerPage = 20;
  totalPages = 1;
  
  showModal = false;
  isEditMode = false;
  selectedRole = 'cashier';
  
  loading = false;
  error = '';
  success = '';
  
  private apiUrl = 'http://localhost:8083/api';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadUsers();
    this.loadCurrentUser();
  }

  private getHeaders(): HttpHeaders {
    const token = this.authService.getAccessToken();
    const headers: any = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return new HttpHeaders(headers);
  }

  loadCurrentUser(): void {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      this.loggedInUser = JSON.parse(userStr);
    }
  }

  loadUsers(): void {
    this.loading = true;
    this.error = '';
    
    let params = `?page=${this.currentPage}&page_size=${this.itemsPerPage}`;
    
    if (this.searchTerm) params += `&search=${this.searchTerm}`;
    if (this.statusFilter) params += `&is_verified=${this.statusFilter === 'verified'}`;
    
    this.http.get<any>(`${this.apiUrl}/users/${params}`, {
      headers: this.getHeaders()
    }).subscribe({
      next: (response: any) => {
        let allUsers = [];
        if (response && response.results) {
          allUsers = response.results;
        } else if (Array.isArray(response)) {
          allUsers = response;
        }
        
        // Filter to only show cashiers (staff) - exclude super_admin and admin
        this.filteredUsers = allUsers.filter((user: User) => 
          user.role === 'CASHIER'
        );
        
        this.totalPages = Math.ceil((response.count || allUsers.length) / this.itemsPerPage);
        this.loading = false;
      },
      error: (err: any) => {
        this.error = 'Failed to load users';
        console.error('Error loading users:', err);
        this.loading = false;
      }
    });
  }

  applyFilters(): void {
    this.currentPage = 1;
    this.loadUsers();
  }

  getUserRole(user: User): string {
    return user.role || 'User';
  }

  openCreateModal(): void {
    this.isEditMode = false;
    this.currentUser = {
      first_name: '',
      last_name: '',
      email: '',
      password: '',
      is_verified: true
    };
    this.selectedRole = 'cashier';
    this.showModal = true;
  }

  openEditModal(user: User): void {
    this.isEditMode = true;
    this.currentUser = { ...user };
    
    if (user.role === 'SUPER_ADMIN') {
      this.selectedRole = 'super_admin';
    } else if (user.role === 'ADMIN') {
      this.selectedRole = 'admin';
    } else {
      this.selectedRole = 'cashier';
    }
    
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.currentUser = {};
    this.error = '';
  }

  saveUser(): void {
    if (!this.validateUser()) {
      return;
    }

    this.loading = true;
    this.error = '';

    const userData: any = {
      email: this.currentUser.email,
      first_name: this.currentUser.first_name,
      last_name: this.currentUser.last_name,
      is_super_admin: this.selectedRole === 'super_admin',
      is_admin: this.selectedRole === 'super_admin' || this.selectedRole === 'admin',
      is_cashier: this.selectedRole === 'cashier',
      is_verified: this.currentUser.is_verified !== false
    };

    if (!this.isEditMode && this.currentUser.password) {
      userData.password = this.currentUser.password;
    }

    const operation = this.isEditMode
      ? this.http.put(`${this.apiUrl}/users/${this.currentUser.id}/`, userData, {
          headers: this.getHeaders()
        })
      : this.http.post(`${this.apiUrl}/users/`, userData, {
          headers: this.getHeaders()
        });

    operation.subscribe({
      next: () => {
        this.success = `User ${this.isEditMode ? 'updated' : 'created'} successfully!`;
        this.closeModal();
        this.loadUsers();
        setTimeout(() => this.success = '', 3000);
      },
      error: (err: any) => {
        this.error = `Failed to ${this.isEditMode ? 'update' : 'create'} user`;
        console.error('Error saving user:', err);
        this.loading = false;
      }
    });
  }

  verifyUser(user: User): void {
    this.loading = true;
    this.http.post(`${this.apiUrl}/users/${user.id}/verify/`, {}, {
      headers: this.getHeaders()
    }).subscribe({
      next: () => {
        this.success = 'User verified successfully!';
        this.loadUsers();
        setTimeout(() => this.success = '', 3000);
      },
      error: (err: any) => {
        this.error = 'Failed to verify user';
        console.error('Error verifying user:', err);
        this.loading = false;
      }
    });
  }

  deleteUser(user: User): void {
    if (!confirm(`Are you sure you want to delete ${user.first_name} ${user.last_name}?`)) {
      return;
    }

    this.loading = true;
    this.http.delete(`${this.apiUrl}/users/${user.id}/`, {
      headers: this.getHeaders()
    }).subscribe({
      next: () => {
        this.success = 'User deleted successfully!';
        this.loadUsers();
        setTimeout(() => this.success = '', 3000);
      },
      error: (err: any) => {
        this.error = 'Failed to delete user';
        console.error('Error deleting user:', err);
        this.loading = false;
      }
    });
  }

  validateUser(): boolean {
    if (!this.currentUser.first_name?.trim()) {
      this.error = 'First name is required';
      return false;
    }
    if (!this.currentUser.last_name?.trim()) {
      this.error = 'Last name is required';
      return false;
    }
    if (!this.currentUser.email?.trim()) {
      this.error = 'Email is required';
      return false;
    }
    if (!this.isEditMode && !this.currentUser.password?.trim()) {
      this.error = 'Password is required';
      return false;
    }
    return true;
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadUsers();
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadUsers();
    }
  }
}
