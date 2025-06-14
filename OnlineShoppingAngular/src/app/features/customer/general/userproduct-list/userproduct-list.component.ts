import { Component, OnInit } from '@angular/core';
import { ProductListItemDTO } from '../../../../core/models/product.model';
import { ProductService } from '../../../../core/services/product.service';
import { WishlistService } from '../../../../core/services/wishlist.service';
import { WishlistDialogComponent } from '../wishlist-dialog/wishlist-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { CartService } from '../../../../core/services/cart.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-userproduct-list',
  standalone: false,
  templateUrl: './userproduct-list.component.html',
  styleUrls: ['./userproduct-list.component.css']
})
export class UserproductListComponent implements OnInit {
  products: ProductListItemDTO[] = [];
  wishList = new Set<number>();
  cartItems: { id: number; quantity: number }[] = [];

  constructor(
    private productService: ProductService,
    private wishlistService: WishlistService,
    private dialog: MatDialog,
    private cartService: CartService
  ) {}

  ngOnInit(): void {
    this.loadProductsWithWishlist();
    this.refreshCart();
  }

  private loadProductsWithWishlist(): void {
    const userId = 4; // replace with dynamic user ID
    this.wishlistService.getWishedProductIds(userId).subscribe({
      next: (wishedIds) => {
        this.wishList = new Set<number>(wishedIds);
        this.productService.getProductList().subscribe({
          next: (products) => this.products = products,
          error: (err) => console.error('Error loading products:', err)
        });
      },
      error: (err) => console.error('Failed to load wishlist:', err)
    });
  }

  toggleWish(productId: number): void {
    const userId = 4;

    if (this.isWished(productId)) {
      this.wishlistService.removeProductFromWishlist(userId, productId).subscribe({
        next: () => {
          this.wishList.delete(productId);
          this.loadProductsWithWishlist();
        },
        error: (err) => {
          console.error('Failed to remove from wishlist:', err);
        }
      });
    } else {
      const dialogRef = this.dialog.open(WishlistDialogComponent, {
        width: '400px',
        data: { productId }
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result && result.added) {
          this.wishList.add(productId);
          this.loadProductsWithWishlist();
        }
      });
    }
  }

  isWished(productId: number | string): boolean {
    const id = typeof productId === 'string' ? +productId : productId;
    return this.wishList.has(id);
  }

  isInStock(item: ProductListItemDTO): boolean {
    return (item.variants?.[0]?.stock ?? 0) > 0;
  }

  private refreshCart(): void {
    this.cartItems = this.cartService
      .getCart()
      .map(i => ({ id: i.id, quantity: i.quantity }));
  }

  getCartQuantity(productId: number): number {
    const entry = this.cartItems.find(i => i.id === productId);
    return entry ? entry.quantity : 0;
  }

  addToCart(item: ProductListItemDTO): void {
    const stock = item.variants?.[0]?.stock ?? 0;
    const inCart = this.getCartQuantity(item.product.id!);

    if (stock === 0) {
      Swal.fire({
        title: '❌ Out of Stock!',
        text: `${item.product.name} သည် လက်ရှိအတွက် မရနိုင်သေးပါ။`,
        icon: 'error',
        toast: true,
        position: 'top',
        showConfirmButton: false,
        timer: 2500,
        background: '#ffe6e6',
        color: '#a70000',
        customClass: { popup: 'custom-toast-popup' }
      });
      return;
    }

   if (inCart >= stock) {
  Swal.fire({
    title: '⚠️ Stock Limit Reached',
    text: `${item.product.name} is out of stock.`,
    icon: 'warning',
    toast: true,
    position: 'top',
    showConfirmButton: false,
    timer: 2000,
    background: '#e8d7c3',  // soft warm brown
    color: '#333',        // deeper brown text
    customClass: {
      popup: 'custom-toast-popup'
    }
  });
  return;
}

    this.cartService.addToCart({
      id: item.product.id,
      name: item.product.name,
      price: item.product.basePrice,
      stock
    });

    this.refreshCart();

    Swal.fire({
      title: '🛒 Added to Cart!',
      text: `${item.product.name} has been added successfully.`,
      icon: 'success',
      toast: true,
      position: 'top',
      showConfirmButton: false,
      timer: 1500,
      background: '#f0fff0',
      color: '#333',
      customClass: { popup: 'custom-toast-popup' }
    });
  }
}