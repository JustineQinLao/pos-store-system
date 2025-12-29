import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ProductService, Product, Variant, AddOn } from '../../services/product.service';
import { CartService, Cart, CartItem } from '../../services/cart.service';
import { PricingService } from '../../services/pricing.service';
import * as CryptoJS from 'crypto-js';

@Component({
  selector: 'app-cashier',
  imports: [CommonModule, FormsModule],
  templateUrl: './cashier.component.html',
  styleUrl: './cashier.component.css'
})
export class CashierComponent implements OnInit {
  qrCodeData: string = '';
  scannedCart: Cart | null = null;
  manualCart: Cart = { items: [], total: 0, itemCount: 0, timestamp: Date.now() };
  products: Product[] = [];
  searchTerm: string = '';
  filteredProducts: Product[] = [];
  showScanner: boolean = false;
  showReceipt: boolean = false;
  showProductSearch: boolean = false;
  receiptData: any = null;
  error: string = '';
  success: string = '';
  selectedProduct: Product | null = null;
  selectedVariant: Variant | null = null;
  selectedAddons: AddOn[] = [];
  quantity: number = 1;
  showProductModal: boolean = false;
  
  // Pagination for product search
  currentPage: number = 1;
  itemsPerPage: number = 12;
  totalProducts: number = 0;
  isLoadingProducts: boolean = false;
  
  private readonly ENCRYPTION_KEY = 'pos-store-cart-encryption-key-2024';

  constructor(
    private productService: ProductService,
    private cartService: CartService,
    public pricingService: PricingService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Don't load products on init - only when user opens product search
  }

  loadProducts(): void {
    this.isLoadingProducts = true;
    this.error = '';
    
    const filters = {
      search: this.searchTerm,
      page: this.currentPage,
      page_size: this.itemsPerPage
    };
    
    this.productService.getProducts(filters).subscribe({
      next: (response: any) => {
        // Handle paginated response
        if (response && response.results) {
          this.filteredProducts = response.results;
          this.totalProducts = response.count || 0;
        } else {
          // Handle non-paginated response
          this.filteredProducts = Array.isArray(response) ? response : [];
          this.totalProducts = this.filteredProducts.length;
        }
        this.isLoadingProducts = false;
      },
      error: () => {
        this.error = 'Failed to load products';
        this.isLoadingProducts = false;
      }
    });
  }

  filterProducts(): void {
    this.currentPage = 1;
    this.loadProducts();
  }

  nextProductPage(): void {
    const totalPages = Math.ceil(this.totalProducts / this.itemsPerPage);
    if (this.currentPage < totalPages) {
      this.currentPage++;
      this.loadProducts();
    }
  }

  previousProductPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadProducts();
    }
  }

  getTotalPages(): number {
    return Math.ceil(this.totalProducts / this.itemsPerPage);
  }

  toggleScanner(): void {
    this.showScanner = !this.showScanner;
    this.error = '';
  }

  scanQRCode(): void {
    if (!this.qrCodeData.trim()) {
      this.error = 'Please enter QR code data';
      return;
    }

    try {
      const decrypted = this.decrypt(this.qrCodeData);
      this.scannedCart = JSON.parse(decrypted);
      this.showScanner = false;
      this.success = 'QR code scanned successfully!';
      setTimeout(() => this.success = '', 3000);
    } catch (e) {
      this.error = 'Invalid QR code. Please try again.';
    }
  }

  private decrypt(encryptedData: string): string {
    const bytes = CryptoJS.AES.decrypt(encryptedData, this.ENCRYPTION_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
  }


  processPayment(): void {
    if (!this.scannedCart) return;

    this.receiptData = {
      items: this.scannedCart.items,
      subtotal: this.getSubtotal(),
      tax: this.getTax(),
      total: this.getTotal(),
      timestamp: new Date(),
      receiptNumber: 'RCP-' + Date.now()
    };

    this.showReceipt = true;
    this.scannedCart = null;
    this.qrCodeData = '';
  }

  printReceipt(): void {
    window.print();
  }

  closeReceipt(): void {
    this.showReceipt = false;
    this.receiptData = null;
  }

  newTransaction(): void {
    this.scannedCart = null;
    this.manualCart = { items: [], total: 0, itemCount: 0, timestamp: Date.now() };
    this.qrCodeData = '';
    this.error = '';
    this.success = '';
    this.showScanner = false;
    this.showProductSearch = false;
    this.selectedProduct = null;
    this.quantity = 1;
  }

  toggleProductSearch(): void {
    this.showProductSearch = !this.showProductSearch;
    this.error = '';
    
    // Load products when opening product search
    if (this.showProductSearch && this.filteredProducts.length === 0) {
      this.loadProducts();
    }
  }

  openProductModal(product: Product): void {
    this.selectedProduct = product;
    this.selectedVariant = null;
    this.selectedAddons = [];
    this.quantity = 1;
    this.showProductModal = true;
    
    // Load full product details with variants and add-ons
    this.productService.getProduct(product.id).subscribe({
      next: (fullProduct) => {
        this.selectedProduct = fullProduct;
      },
      error: () => {
        this.error = 'Failed to load product details';
      }
    });
  }

  closeProductModal(): void {
    this.showProductModal = false;
    this.selectedProduct = null;
    this.selectedVariant = null;
    this.selectedAddons = [];
    this.quantity = 1;
  }

  toggleAddon(addon: AddOn): void {
    const index = this.selectedAddons.findIndex(a => a.id === addon.id);
    if (index > -1) {
      this.selectedAddons.splice(index, 1);
    } else {
      this.selectedAddons.push(addon);
    }
  }

  isAddonSelected(addon: AddOn): boolean {
    return this.selectedAddons.some(a => a.id === addon.id);
  }

  addProductToCart(product?: Product): void {
    const productToAdd = product || this.selectedProduct;
    if (!productToAdd) return;

    // Check stock availability
    const currentStock = productToAdd.current_stock;
    const existingItem = this.manualCart.items.find(item => 
      item.product.id === productToAdd.id && 
      item.variant?.id === this.selectedVariant?.id &&
      this.arraysEqual(item.addons.map(a => a.id), this.selectedAddons.map(a => a.id))
    );

    const currentCartQuantity = existingItem ? existingItem.quantity : 0;
    const totalQuantity = currentCartQuantity + this.quantity;

    if (totalQuantity > currentStock) {
      this.error = `Cannot add ${this.quantity} items. Only ${currentStock - currentCartQuantity} available in stock.`;
      setTimeout(() => this.error = '', 3000);
      return;
    }

    if (existingItem) {
      existingItem.quantity += this.quantity;
      existingItem.subtotal = this.pricingService.calculateItemPrice(
        productToAdd, 
        existingItem.variant, 
        existingItem.addons, 
        existingItem.quantity
      );
    } else {
      const newItem: CartItem = {
        product: productToAdd,
        variant: this.selectedVariant || undefined,
        addons: [...this.selectedAddons],
        quantity: this.quantity,
        subtotal: this.pricingService.calculateItemPrice(
          productToAdd, 
          this.selectedVariant || undefined, 
          this.selectedAddons, 
          this.quantity
        )
      };
      this.manualCart.items.push(newItem);
    }

    this.updateManualCartTotals();
    this.success = `Added ${productToAdd.name} to cart`;
    setTimeout(() => this.success = '', 2000);
    
    if (this.showProductModal) {
      this.closeProductModal();
    }
  }

  private arraysEqual(arr1: any[], arr2: any[]): boolean {
    if (arr1.length !== arr2.length) return false;
    const sorted1 = [...arr1].sort();
    const sorted2 = [...arr2].sort();
    return sorted1.every((val, index) => val === sorted2[index]);
  }

  removeFromManualCart(index: number): void {
    this.manualCart.items.splice(index, 1);
    this.updateManualCartTotals();
  }

  updateQuantity(index: number, newQuantity: number): void {
    if (newQuantity <= 0) {
      this.removeFromManualCart(index);
      return;
    }
    
    const item = this.manualCart.items[index];
    const currentStock = item.product.current_stock;
    
    if (newQuantity > currentStock) {
      this.error = `Cannot set quantity to ${newQuantity}. Only ${currentStock} available in stock.`;
      setTimeout(() => this.error = '', 3000);
      return;
    }
    
    item.quantity = newQuantity;
    item.subtotal = this.pricingService.calculateItemPrice(
      item.product,
      item.variant,
      item.addons,
      item.quantity
    );
    this.updateManualCartTotals();
  }

  private updateManualCartTotals(): void {
    this.manualCart.total = this.pricingService.calculateTotal(this.manualCart.items);
    this.manualCart.itemCount = this.manualCart.items.reduce((total, item) => total + item.quantity, 0);
  }

  processManualPayment(): void {
    if (this.manualCart.items.length === 0) {
      this.error = 'No items in cart';
      return;
    }

    const subtotal = this.pricingService.calculateSubtotal(this.manualCart.items);
    const tax = this.pricingService.calculateTax(this.manualCart.items);
    const total = this.pricingService.calculateTotal(this.manualCart.items);

    // Prompt for amount paid
    const amountPaidStr = prompt(`Total: $${total.toFixed(2)}\nEnter amount paid:`);
    if (!amountPaidStr) {
      this.error = 'Payment cancelled';
      return;
    }

    const amountPaid = parseFloat(amountPaidStr);
    if (isNaN(amountPaid) || amountPaid < total) {
      this.error = `Insufficient payment. Total: $${total.toFixed(2)}`;
      return;
    }

    // Prepare transaction data
    const transactionData = {
      cart_items: this.manualCart.items.map(item => ({
        product: {
          id: item.product.id,
          name: item.product.name,
          sku: item.product.sku,
          base_price: item.product.base_price
        },
        variant: item.variant ? {
          id: item.variant.id,
          name: item.variant.name,
          price_adjustment: item.variant.price_adjustment
        } : null,
        addons: item.addons.map(addon => ({
          id: addon.id,
          name: addon.name,
          price: addon.price
        })),
        quantity: item.quantity,
        subtotal: item.subtotal
      })),
      subtotal: subtotal,
      tax: tax,
      total: total,
      amount_paid: amountPaid,
      payment_method: 'CASH',
      notes: ''
    };

    // Call API to process payment
    this.productService.processPayment(transactionData).subscribe({
      next: (response: any) => {
        this.receiptData = {
          items: this.manualCart.items,
          subtotal: subtotal,
          tax: tax,
          total: total,
          amountPaid: amountPaid,
          change: response.change,
          timestamp: new Date(),
          receiptNumber: response.transaction.transaction_number
        };

        this.showReceipt = true;
        this.success = 'Payment processed successfully!';
        this.manualCart = { items: [], total: 0, itemCount: 0, timestamp: Date.now() };
      },
      error: (err: any) => {
        this.error = err.error?.error || 'Failed to process payment';
        console.error('Payment error:', err);
      }
    });
  }

  getCurrentCart(): Cart | null {
    return this.scannedCart || (this.manualCart.items.length > 0 ? this.manualCart : null);
  }

  getItemPrice(item: CartItem): number {
    return this.pricingService.calculateItemPrice(
      item.product,
      item.variant,
      item.addons,
      item.quantity
    );
  }

  getAddonsText(item: CartItem): string {
    if (!item.addons || item.addons.length === 0) return '-';
    return item.addons.map(a => a.name).join(', ');
  }

  getSubtotal(): number {
    return this.pricingService.calculateSubtotal(this.getCurrentCart()?.items || []);
  }

  getTax(): number {
    return this.pricingService.calculateTax(this.getCurrentCart()?.items || []);
  }

  getTotal(): number {
    return this.pricingService.calculateTotal(this.getCurrentCart()?.items || []);
  }
}
