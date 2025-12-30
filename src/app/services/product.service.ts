import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthService } from './auth.service';

export interface Category {
  id: number;
  name: string;
  description: string;
  image?: string;
  is_active: boolean;
  product_count: number;
  created_at: string;
  updated_at: string;
}

export interface Variant {
  id: number;
  product: number;
  name: string;
  price_adjustment: number;
  final_price: number;
  sku_suffix: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AddOn {
  id: number;
  name: string;
  description: string;
  price: number;
  applicable_products: number[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Inventory {
  id: number;
  product: number;
  product_name: string;
  variant?: number;
  variant_name?: string;
  quantity: number;
  low_stock_threshold: number;
  is_low_stock: boolean;
  is_out_of_stock: boolean;
  last_restocked?: string;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: number;
  name: string;
  description: string;
  category: number | Category;
  category_name?: string;
  base_price: number;
  image?: string;
  sku: string;
  is_taxable: boolean;
  is_active: boolean;
  current_stock: number;
  variants?: Variant[];
  available_addons?: AddOn[];
  inventories?: Inventory[];
  created_at: string;
  updated_at?: string;
}

export interface ProductFilters {
  category?: number;
  min_price?: number;
  max_price?: number;
  in_stock?: boolean;
  search?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private apiUrl = 'http://localhost:8083/api';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) { }

  private getHeaders(): HttpHeaders {
    const token = this.authService.getAccessToken();
    const headers: any = {
      'Content-Type': 'application/json'
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return new HttpHeaders(headers);
  }

  // Category Methods
  getCategories(activeOnly: boolean = false, paginationParams?: any): Observable<any> {
    let params = new HttpParams();
    if (activeOnly) {
      params = params.set('is_active', 'true');
    }
    if (paginationParams) {
      Object.keys(paginationParams).forEach(key => {
        if (paginationParams[key]) {
          params = params.set(key, paginationParams[key].toString());
        }
      });
    }
    return this.http.get<any>(`${this.apiUrl}/categories/`, { params });
  }

  getCategory(id: number): Observable<Category> {
    return this.http.get<Category>(`${this.apiUrl}/categories/${id}/`);
  }

  createCategory(category: Partial<Category>): Observable<Category> {
    return this.http.post<Category>(`${this.apiUrl}/categories/`, category, {
      headers: this.getHeaders()
    });
  }

  updateCategory(id: number, category: Partial<Category>): Observable<Category> {
    return this.http.put<Category>(`${this.apiUrl}/categories/${id}/`, category, {
      headers: this.getHeaders()
    });
  }

  deleteCategory(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/categories/${id}/`, {
      headers: this.getHeaders()
    });
  }

  // Product Methods
  getProducts(filters?: any): Observable<any> {
    let params = new HttpParams();
    
    // Set page_size to 10 for server-side pagination
    params = params.set('page_size', '10');
    
    if (filters) {
      if (filters.category) {
        params = params.set('category', filters.category.toString());
      }
      if (filters.min_price) {
        params = params.set('min_price', filters.min_price.toString());
      }
      if (filters.max_price) {
        params = params.set('max_price', filters.max_price.toString());
      }
      if (filters.in_stock !== undefined) {
        params = params.set('in_stock', filters.in_stock.toString());
      }
      if (filters.search) {
        params = params.set('search', filters.search);
      }
      if (filters.page) {
        params = params.set('page', filters.page.toString());
      }
      if (filters.page_size) {
        params = params.set('page_size', filters.page_size.toString());
      }
    }
    
    // Return the full response object (including count, next, previous, results)
    return this.http.get<any>(`${this.apiUrl}/products/`, { params });
  }

  getProduct(id: number): Observable<Product> {
    return this.http.get<Product>(`${this.apiUrl}/products/${id}/`);
  }

  createProduct(product: Partial<Product>): Observable<Product> {
    return this.http.post<Product>(`${this.apiUrl}/products/`, product, {
      headers: this.getHeaders()
    });
  }

  updateProduct(id: number, product: Partial<Product>): Observable<Product> {
    return this.http.put<Product>(`${this.apiUrl}/products/${id}/`, product, {
      headers: this.getHeaders()
    });
  }

  deleteProduct(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/products/${id}/`, {
      headers: this.getHeaders()
    });
  }

  // Product methods with image upload support
  createProductWithImage(formData: FormData): Observable<Product> {
    const token = this.authService.getAccessToken();
    const headers: any = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    // Don't set Content-Type for FormData - browser will set it with boundary
    return this.http.post<Product>(`${this.apiUrl}/products/`, formData, {
      headers: new HttpHeaders(headers)
    });
  }

  updateProductWithImage(id: number, formData: FormData): Observable<Product> {
    const token = this.authService.getAccessToken();
    const headers: any = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    // Don't set Content-Type for FormData - browser will set it with boundary
    return this.http.put<Product>(`${this.apiUrl}/products/${id}/`, formData, {
      headers: new HttpHeaders(headers)
    });
  }

  getLowStockProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.apiUrl}/products/low_stock/`, {
      headers: this.getHeaders()
    });
  }

  getOutOfStockProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.apiUrl}/products/out_of_stock/`, {
      headers: this.getHeaders()
    });
  }

  // Variant Methods
  getVariants(productId?: number): Observable<Variant[]> {
    let params = new HttpParams();
    if (productId) {
      params = params.set('product', productId.toString());
    }
    return this.http.get<any>(`${this.apiUrl}/variants/`, { params }).pipe(
      map((response: any) => {
        if (response && response.results && Array.isArray(response.results)) {
          return response.results;
        }
        if (Array.isArray(response)) {
          return response;
        }
        return [];
      })
    );
  }

  getVariant(id: number): Observable<Variant> {
    return this.http.get<Variant>(`${this.apiUrl}/variants/${id}/`);
  }

  createVariant(variant: Partial<Variant>): Observable<Variant> {
    return this.http.post<Variant>(`${this.apiUrl}/variants/`, variant, {
      headers: this.getHeaders()
    });
  }

  updateVariant(id: number, variant: Partial<Variant>): Observable<Variant> {
    return this.http.put<Variant>(`${this.apiUrl}/variants/${id}/`, variant, {
      headers: this.getHeaders()
    });
  }

  deleteVariant(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/variants/${id}/`, {
      headers: this.getHeaders()
    });
  }

  // Add-on Methods
  getAddOns(productId?: number): Observable<AddOn[]> {
    let params = new HttpParams();
    if (productId) {
      params = params.set('product', productId.toString());
    }
    return this.http.get<any>(`${this.apiUrl}/addons/`, { params }).pipe(
      map((response: any) => {
        if (response && response.results && Array.isArray(response.results)) {
          return response.results;
        }
        if (Array.isArray(response)) {
          return response;
        }
        return [];
      })
    );
  }

  getAddOn(id: number): Observable<AddOn> {
    return this.http.get<AddOn>(`${this.apiUrl}/addons/${id}/`);
  }

  createAddOn(addon: Partial<AddOn>): Observable<AddOn> {
    return this.http.post<AddOn>(`${this.apiUrl}/addons/`, addon, {
      headers: this.getHeaders()
    });
  }

  updateAddOn(id: number, addon: Partial<AddOn>): Observable<AddOn> {
    return this.http.put<AddOn>(`${this.apiUrl}/addons/${id}/`, addon, {
      headers: this.getHeaders()
    });
  }

  deleteAddOn(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/addons/${id}/`, {
      headers: this.getHeaders()
    });
  }

  // Inventory Methods
  getInventory(params?: any): Observable<any> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null) {
          httpParams = httpParams.set(key, params[key].toString());
        }
      });
    }
    return this.http.get<any>(`${this.apiUrl}/inventory/`, { 
      headers: this.getHeaders(),
      params: httpParams 
    });
  }

  getInventoryItem(id: number): Observable<Inventory> {
    return this.http.get<Inventory>(`${this.apiUrl}/inventory/${id}/`, {
      headers: this.getHeaders()
    });
  }

  createInventory(inventory: Partial<Inventory>): Observable<Inventory> {
    return this.http.post<Inventory>(`${this.apiUrl}/inventory/`, inventory, {
      headers: this.getHeaders()
    });
  }

  updateInventory(id: number, inventory: Partial<Inventory>): Observable<Inventory> {
    return this.http.put<Inventory>(`${this.apiUrl}/inventory/${id}/`, inventory, {
      headers: this.getHeaders()
    });
  }

  deleteInventory(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/inventory/${id}/`, {
      headers: this.getHeaders()
    });
  }

  restockInventory(id: number, quantity: number): Observable<Inventory> {
    return this.http.post<Inventory>(`${this.apiUrl}/inventory/${id}/restock/`, 
      { quantity },
      { headers: this.getHeaders() }
    );
  }

  adjustInventory(id: number, adjustment: number): Observable<Inventory> {
    return this.http.post<Inventory>(`${this.apiUrl}/inventory/${id}/adjust/`, 
      { adjustment },
      { headers: this.getHeaders() }
    );
  }

  // Image Upload
  uploadProductImage(productId: number, file: File): Observable<Product> {
    const formData = new FormData();
    formData.append('image', file);
    
    const token = this.authService.getAccessToken();
    const headers: any = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return this.http.patch<Product>(`${this.apiUrl}/products/${productId}/`, formData, {
      headers: new HttpHeaders(headers)
    });
  }

  uploadCategoryImage(categoryId: number, file: File): Observable<Category> {
    const formData = new FormData();
    formData.append('image', file);
    
    const token = this.authService.getAccessToken();
    const headers: any = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return this.http.patch<Category>(`${this.apiUrl}/categories/${categoryId}/`, formData, {
      headers: new HttpHeaders(headers)
    });
  }

  // Transaction Methods
  processPayment(transactionData: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/transactions/process-payment/`, transactionData, {
      headers: this.getHeaders()
    });
  }

  getTransactions(params?: any): Observable<any> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key]) {
          httpParams = httpParams.set(key, params[key].toString());
        }
      });
    }
    return this.http.get<any>(`${this.apiUrl}/transactions/`, {
      headers: this.getHeaders(),
      params: httpParams
    });
  }

  getTransaction(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/transactions/${id}/`, {
      headers: this.getHeaders()
    });
  }
}
