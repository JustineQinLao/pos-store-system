import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../../../services/auth.service';

interface AnalyticsData {
  totalRevenue: number;
  totalTransactions: number;
  averageOrderValue: number;
  totalItemsSold: number;
  topProducts: Array<{
    name: string;
    category: string;
    units_sold: number;
    revenue: number;
  }>;
  dailyTrends: Array<{
    date: string;
    transactions: number;
    revenue: number;
  }>;
}

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './analytics.component.html',
  styleUrl: './analytics.component.css'
})
export class AnalyticsComponent implements OnInit {
  analytics: AnalyticsData = {
    totalRevenue: 0,
    totalTransactions: 0,
    averageOrderValue: 0,
    totalItemsSold: 0,
    topProducts: [],
    dailyTrends: []
  };
  
  startDate: string = '';
  endDate: string = '';
  loading = false;
  error = '';
  
  private apiUrl = 'http://localhost:8083/api';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {
    // Set default date range (last 30 days)
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);
    
    this.endDate = today.toISOString().split('T')[0];
    this.startDate = thirtyDaysAgo.toISOString().split('T')[0];
  }

  ngOnInit(): void {
    this.loadAnalytics();
  }

  private getHeaders(): HttpHeaders {
    const token = this.authService.getAccessToken();
    const headers: any = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return new HttpHeaders(headers);
  }

  loadAnalytics(): void {
    this.loading = true;
    this.error = '';
    
    const params = `?start_date=${this.startDate}&end_date=${this.endDate}`;
    
    this.http.get<any>(`${this.apiUrl}/analytics/${params}`, {
      headers: this.getHeaders()
    }).subscribe({
      next: (data: any) => {
        this.analytics = {
          totalRevenue: data.total_revenue || 0,
          totalTransactions: data.total_transactions || 0,
          averageOrderValue: data.average_order_value || 0,
          totalItemsSold: data.total_items_sold || 0,
          topProducts: data.top_products || [],
          dailyTrends: data.daily_trends || []
        };
        this.loading = false;
      },
      error: (err: any) => {
        this.error = 'Failed to load analytics data';
        console.error('Error loading analytics:', err);
        this.loading = false;
      }
    });
  }
}
