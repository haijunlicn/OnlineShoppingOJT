
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { LoginModalService } from '../../../../core/services/LoginModalService';
import { RegisterModalService } from '../../../../core/services/RegisterModalService';
import { ForgotPasswordModalService } from '../../../../core/services/ForgotPasswordModalService';
import { CategoryService } from '@app/core/services/category.service';
import { CategoryDTO } from '@app/core/models/category-dto';
import { AuthService } from '@app/core/services/auth.service';
import { DiscountDisplayService } from '@app/core/services/discount-display.service';
import { DiscountEventDTO } from '@app/core/models/discount';

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

  discounts: DiscountEventDTO[] = [];
  currentIndex = 0;
  countdowns: string[] = [];
  private countdownInterval: any;

  constructor(
    private categoryService: CategoryService,
    private loginModalService: LoginModalService,
    private registerModalService: RegisterModalService,
    private forgotModalService: ForgotPasswordModalService,
    private authService: AuthService,
    private discountDisplayService: DiscountDisplayService,
  ) { }

  ngOnInit(): void {
    this.loadDiscounts();
    this.loadCategories();
  }

  loadDiscounts(): void {
    this.discountDisplayService.getAllPublicActiveDiscounts().subscribe(data => {
      this.discounts = data;
    });
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
