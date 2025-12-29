import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CartService, Cart, CartItem } from '../../services/cart.service';
import { PricingService } from '../../services/pricing.service';
import QRCode from 'qrcode';

@Component({
  selector: 'app-cart',
  imports: [CommonModule],
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.css'
})
export class CartComponent implements OnInit {
  cart: Cart = { items: [], total: 0, itemCount: 0, timestamp: Date.now() };
  qrCodeUrl: string = '';
  showQRCode: boolean = false;
  loading: boolean = false;

  constructor(
    private cartService: CartService,
    private pricingService: PricingService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadCart();
    
    this.cartService.cart$.subscribe(cart => {
      this.cart = cart;
    });
  }

  loadCart(): void {
    this.cart = this.cartService.getCart();
  }

  updateQuantity(index: number, quantity: number): void {
    if (quantity > 0) {
      this.cartService.updateQuantity(index, quantity);
    }
  }

  removeItem(index: number): void {
    if (confirm('Remove this item from cart?')) {
      this.cartService.removeFromCart(index);
    }
  }

  clearCart(): void {
    if (confirm('Clear all items from cart?')) {
      this.cartService.clearCart();
      this.showQRCode = false;
      this.qrCodeUrl = '';
    }
  }

  async generateQRCode(): Promise<void> {
    if (this.cart.items.length === 0) {
      alert('Your cart is empty!');
      return;
    }

    this.loading = true;
    try {
      const encryptedData = this.cartService.generateCheckoutQR();
      
      this.qrCodeUrl = await QRCode.toDataURL(encryptedData, {
        width: 400,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      
      this.showQRCode = true;
    } catch (error) {
      console.error('Error generating QR code:', error);
      alert('Failed to generate QR code. Please try again.');
    } finally {
      this.loading = false;
    }
  }

  closeQRCode(): void {
    this.showQRCode = false;
  }

  continueShopping(): void {
    this.router.navigate(['/products']);
  }

  getItemTotal(item: CartItem): number {
    return item.subtotal;
  }

  getVariantName(item: CartItem): string {
    return item.variant?.name || '';
  }

  getAddonsText(item: CartItem): string {
    if (item.addons.length === 0) return '';
    return item.addons.map(a => a.name).join(', ');
  }

  getTaxAmount(): number {
    return this.pricingService.calculateTax(this.cart.items);
  }

  getGrandTotal(): number {
    return this.pricingService.calculateTotal(this.cart.items);
  }
}
