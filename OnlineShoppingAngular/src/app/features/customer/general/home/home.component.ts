
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { LoginModalService } from '../../../../core/services/LoginModalService';
import { RegisterModalService } from '../../../../core/services/RegisterModalService';
import { ForgotPasswordModalService } from '../../../../core/services/ForgotPasswordModalService';
import { CategoryService } from '@app/core/services/category.service';
import { CategoryDTO } from '@app/core/models/category-dto';
import { AuthService } from '@app/core/services/auth.service';

interface Category {
  name: string;
  image: string;
  link: string;
}

interface Product {
  name: string;
  image: string;
  price: number;
  rating: number;
}

interface Testimonial {
  name: string;
  avatar: string;
  quote: string;
  rating: number;
}

@Component({
  selector: 'app-home',
  standalone: false,
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  categories: { name: string, image: string, link: string }[] = [];

  @ViewChild('carousel', { static: false }) carouselRef!: ElementRef;

  featuredProducts: Product[] = [
    { name: 'Classic Black Handbag', image: 'assets/images/products/handbag.jpg', price: 285000, rating: 4.8 },
    { name: 'Designer Watch', image: 'assets/images/products/watch.jpg', price: 450000, rating: 4.9 },
    { name: 'Leather Wallet', image: 'assets/images/products/wallet.jpg', price: 85000, rating: 4.5 },
    { name: 'Sunglasses', image: 'assets/images/products/sunglasses.jpg', price: 120000, rating: 4.7 },
  ];

  testimonials: Testimonial[] = [
    { name: 'Aye Chan', avatar: 'assets/images/testimonials/user1.jpg', quote: 'Amazing quality and fast delivery!', rating: 5 },
    { name: 'Myo Min', avatar: 'assets/images/testimonials/user2.jpg', quote: 'Great customer service and beautiful products.', rating: 5 },
    { name: 'Su Su', avatar: 'assets/images/testimonials/user3.jpg', quote: 'I love shopping here. Always something new!', rating: 4 },
  ];

  constructor(
    private categoryService: CategoryService,
    private loginModalService: LoginModalService,
    private registerModalService: RegisterModalService,
    private forgotModalService: ForgotPasswordModalService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {
    this.categoryService.getAllPublicCategories().subscribe((data: CategoryDTO[]) => {
      this.categories = data.map(dto => ({
        name: dto.name || '',
        image: dto.imgPath || 'assets/images/categories/default.jpg',
        link: `/customer/productList?category=${encodeURIComponent(dto.name || '')}`
      }));
    });
  }

  scrollLeft(): void {
    const carousel = this.carouselRef.nativeElement as HTMLElement;
    const cardWidth = carousel.querySelector('.category-card')?.clientWidth || 300;
    carousel.scrollBy({ left: -cardWidth * 4, behavior: 'smooth' });
  }

  scrollRight(): void {
    const carousel = this.carouselRef.nativeElement as HTMLElement;
    const cardWidth = carousel.querySelector('.category-card')?.clientWidth || 300;
    carousel.scrollBy({ left: cardWidth * 4, behavior: 'smooth' });
  }


  get loginVisible$() {
    return this.loginModalService.loginVisible$;
  }

  get registerVisible$() {
    return this.registerModalService.registerVisible$;
  }

  get forgotVisible$() {
    return this.forgotModalService.forgotVisible$;
  }

  onShopNow() {
    window.scrollTo({ top: 600, behavior: 'smooth' });
  }

  onAddToCart(product: Product) {
    console.log('Add to Cart:', product.name);
  }

  onWishlist(product: Product) {
    console.log('Wishlist:', product.name);
  }

  getRatingStars(rating: number) {
    const maxRating = 5;
    const filledStars = Math.round(rating);
    return Array(maxRating).fill(0).map((_, i) => i < filledStars);
  }

  onSearch(query: string) {
    console.log('Homepage search:', query);
  }

  onSubscribe(email: string) {
    console.log('Newsletter subscribe:', email);
  }
}
