import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import * as CryptoJS from 'crypto-js';
import { Product, Variant, AddOn } from './product.service';
import { PricingService } from './pricing.service';

export interface CartItem {
  product: Product;
  variant?: Variant;
  addons: AddOn[];
  quantity: number;
  subtotal: number;
}

export interface Cart {
  items: CartItem[];
  total: number;
  itemCount: number;
  timestamp: number;
}

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private readonly CART_KEY = 'pos_cart';
  private readonly ENCRYPTION_KEY = 'pos-store-cart-encryption-key-2024';
  
  private cartSubject = new BehaviorSubject<Cart>(this.loadCart());
  public cart$: Observable<Cart> = this.cartSubject.asObservable();

  constructor(private pricingService: PricingService) {
    this.loadCart();
  }

  private encrypt(data: string): string {
    return CryptoJS.AES.encrypt(data, this.ENCRYPTION_KEY).toString();
  }

  private decrypt(encryptedData: string): string {
    const bytes = CryptoJS.AES.decrypt(encryptedData, this.ENCRYPTION_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
  }

  private loadCart(): Cart {
    try {
      const encryptedCart = localStorage.getItem(this.CART_KEY);
      if (encryptedCart) {
        const decryptedCart = this.decrypt(encryptedCart);
        const cart = JSON.parse(decryptedCart) as Cart;
        return cart;
      }
    } catch (error) {
      console.error('Error loading cart:', error);
      localStorage.removeItem(this.CART_KEY);
    }
    
    return {
      items: [],
      total: 0,
      itemCount: 0,
      timestamp: Date.now()
    };
  }

  private saveCart(cart: Cart): void {
    try {
      cart.timestamp = Date.now();
      const cartJson = JSON.stringify(cart);
      const encryptedCart = this.encrypt(cartJson);
      localStorage.setItem(this.CART_KEY, encryptedCart);
      this.cartSubject.next(cart);
    } catch (error) {
      console.error('Error saving cart:', error);
    }
  }

  private calculateSubtotal(product: Product, variant?: Variant, addons: AddOn[] = [], quantity: number = 1): number {
    return this.pricingService.calculateItemPrice(product, variant, addons, quantity);
  }

  private recalculateCart(cart: Cart): Cart {
    cart.total = cart.items.reduce((sum, item) => sum + item.subtotal, 0);
    cart.itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);
    return cart;
  }

  addToCart(product: Product, variant?: Variant, addons: AddOn[] = [], quantity: number = 1): void {
    const cart = this.loadCart();
    
    const existingItemIndex = cart.items.findIndex(item => 
      item.product.id === product.id &&
      item.variant?.id === variant?.id &&
      JSON.stringify(item.addons.map(a => a.id).sort()) === JSON.stringify(addons.map(a => a.id).sort())
    );

    if (existingItemIndex > -1) {
      cart.items[existingItemIndex].quantity += quantity;
      cart.items[existingItemIndex].subtotal = this.calculateSubtotal(
        product,
        variant,
        addons,
        cart.items[existingItemIndex].quantity
      );
    } else {
      const cartItem: CartItem = {
        product,
        variant,
        addons,
        quantity,
        subtotal: this.calculateSubtotal(product, variant, addons, quantity)
      };
      cart.items.push(cartItem);
    }

    this.saveCart(this.recalculateCart(cart));
  }

  removeFromCart(index: number): void {
    const cart = this.loadCart();
    if (index >= 0 && index < cart.items.length) {
      cart.items.splice(index, 1);
      this.saveCart(this.recalculateCart(cart));
    }
  }

  updateQuantity(index: number, quantity: number): void {
    const cart = this.loadCart();
    if (index >= 0 && index < cart.items.length && quantity > 0) {
      cart.items[index].quantity = quantity;
      cart.items[index].subtotal = this.calculateSubtotal(
        cart.items[index].product,
        cart.items[index].variant,
        cart.items[index].addons,
        quantity
      );
      this.saveCart(this.recalculateCart(cart));
    }
  }

  clearCart(): void {
    const emptyCart: Cart = {
      items: [],
      total: 0,
      itemCount: 0,
      timestamp: Date.now()
    };
    this.saveCart(emptyCart);
  }

  getCart(): Cart {
    return this.loadCart();
  }

  getCartItemCount(): number {
    return this.loadCart().itemCount;
  }

  getCartTotal(): number {
    return this.loadCart().total;
  }

  generateCheckoutQR(): string {
    const cart = this.loadCart();
    
    const checkoutData = {
      items: cart.items.map(item => ({
        productId: item.product.id,
        productName: item.product.name,
        productSku: item.product.sku,
        variantId: item.variant?.id,
        variantName: item.variant?.name,
        addonIds: item.addons.map(a => a.id),
        quantity: item.quantity,
        subtotal: item.subtotal
      })),
      total: cart.total,
      itemCount: cart.itemCount,
      timestamp: cart.timestamp
    };

    const checkoutJson = JSON.stringify(checkoutData);
    const encryptedCheckout = this.encrypt(checkoutJson);
    
    return encryptedCheckout;
  }

  decryptCheckoutQR(encryptedData: string): any {
    try {
      const decryptedData = this.decrypt(encryptedData);
      return JSON.parse(decryptedData);
    } catch (error) {
      console.error('Error decrypting QR code:', error);
      return null;
    }
  }
}
