// import { Component, OnInit } from '@angular/core';
// import { WishlistDTO } from '../../../../core/models/wishlist-dto';
// import { WishlistService } from '../../../../core/services/wishlist.service';
// import { WishlistTitleDTO } from '../../../../core/models/wishlist-titleDTO';
// import { ProductCardItem, ProductImageDTO } from '../../../../core/models/product.model';
// import { Router } from '@angular/router';

// @Component({
//   selector: 'app-wishlist',
//   standalone: false,
//   templateUrl: './wishlist.component.html',
//   styleUrl: './wishlist.component.css'
// })
// export class WishlistComponent implements OnInit {
//   userId = 4; // Replace with actual authenticated user ID
//   wishlistTitles: WishlistTitleDTO[] = [];
//   wishlistProducts: { [titleId: number]: WishlistDTO[] } = {};

//   constructor(private wishlistService: WishlistService,private router:Router) {}

//   ngOnInit(): void {
//     this.loadWishlistTitles();
//     console.log("wished pds : " , this.wishlistProducts);
    
//   }

//   loadWishlistTitles(): void {
//     this.wishlistService.getWishlistTitles(this.userId).subscribe({
//       next: (titles) => {
//         this.wishlistTitles = titles;
//         this.loadProductsForTitles(titles);
//       },
//       error: (err) => {
//         console.error('Failed to load wishlist titles:', err);
//       }
//     });
//   }

//   loadProductsForTitles(titles: WishlistTitleDTO[]): void {
//   titles.forEach(title => {
//     if (title.id === undefined) return; // skip undefined ids
//     this.wishlistService.getProductsByWishlistTitle(title.id).subscribe({
//       next: (products) => {
//         this.wishlistProducts[title.id!] = products;
//          console.log("wished pds : " , products);
//       },
//       error: (err) => {
//         console.error(`Failed to load products for title ${title.title}:`, err);
//       }
//     });
//   });
// }
// removeProductFromWishlistTitle(titleId: number, productId: number): void {
//   this.wishlistService.removeProductFromSpecificWishlistTitle(this.userId, titleId, productId).subscribe({
//     next: () => {
//       // Reload products for the updated title
//       this.wishlistService.getProductsByWishlistTitle(titleId).subscribe({
//         next: (products) => {
//           this.wishlistProducts[titleId] = products;
//         },
//         error: (err) => {
//           console.error('Failed to reload products:', err);
//         }
//       });
//     },
//     error: (err) => {
//       console.error('Failed to remove product:', err);
//     }
//   });
// }
// removeWishlistTitle(titleId: number): void {
//     this.wishlistService.removeWishlistTitle(titleId).subscribe({
//       next: () => {
//         // Remove the title from the local array and its products
//         this.wishlistTitles = this.wishlistTitles.filter(t => t.id !== titleId);
//         delete this.wishlistProducts[titleId];
//       },
//       error: (err) => {
//         console.error('Failed to remove wishlist title:', err);
//       }
//     });
//   }

// getMainImage(images: ProductImageDTO[] | undefined): string | null {
//     if (!images || images.length === 0) return null;
//     const mainImage = images.find(img => img.mainImageStatus);
//     return mainImage ? mainImage.imgPath! : images[0].imgPath!;
//   }
// goToDetail(product: any): void {
//   // or product: ProductDTO (your actual type)
//   this.router.navigate(['/customer/product', product.id]);
// }


// }
import { Component, OnInit } from '@angular/core';
import { WishlistDTO } from '../../../../core/models/wishlist-dto';
import { WishlistService } from '../../../../core/services/wishlist.service';
import { WishlistTitleDTO } from '../../../../core/models/wishlist-titleDTO';
import { ProductImageDTO } from '../../../../core/models/product.model';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service'; // import your AuthService

@Component({
  selector: 'app-wishlist',
  standalone: false,
  templateUrl: './wishlist.component.html',
  styleUrls: ['./wishlist.component.css']
})
export class WishlistComponent implements OnInit {
  userId?: number;  // make userId optional here
  wishlistTitles: WishlistTitleDTO[] = [];
  wishlistProducts: { [titleId: number]: WishlistDTO[] } = {};

  constructor(
    private wishlistService: WishlistService,
    private router: Router,
    private authService: AuthService // inject AuthService
  ) {}

  ngOnInit(): void {
    this.userId = this.authService.getCurrentUser()?.id;
    if (!this.userId) {
      console.error('User is not authenticated!');
      return;
    }
    this.loadWishlistTitles();
    console.log("wished pds : " , this.wishlistProducts);
  }

  loadWishlistTitles(): void {
    if (!this.userId) return;
    this.wishlistService.getWishlistTitles(this.userId).subscribe({
      next: (titles) => {
        this.wishlistTitles = titles;
        this.loadProductsForTitles(titles);
      },
      error: (err) => {
        console.error('Failed to load wishlist titles:', err);
      }
    });
  }

  loadProductsForTitles(titles: WishlistTitleDTO[]): void {
    titles.forEach(title => {
      if (title.id === undefined) return;
      this.wishlistService.getProductsByWishlistTitle(title.id).subscribe({
        next: (products) => {
          this.wishlistProducts[title.id!] = products;
          console.log("wished pds : ", products);
        },
        error: (err) => {
          console.error(`Failed to load products for title ${title.title}:`, err);
        }
      });
    });
  }

  removeProductFromWishlistTitle(titleId: number, productId: number): void {
    if (!this.userId) return;
    this.wishlistService.removeProductFromSpecificWishlistTitle(this.userId, titleId, productId).subscribe({
      next: () => {
        this.wishlistService.getProductsByWishlistTitle(titleId).subscribe({
          next: (products) => {
            this.wishlistProducts[titleId] = products;
          },
          error: (err) => {
            console.error('Failed to reload products:', err);
          }
        });
      },
      error: (err) => {
        console.error('Failed to remove product:', err);
      }
    });
  }

  removeWishlistTitle(titleId: number): void {
    this.wishlistService.removeWishlistTitle(titleId).subscribe({
      next: () => {
        this.wishlistTitles = this.wishlistTitles.filter(t => t.id !== titleId);
        delete this.wishlistProducts[titleId];
      },
      error: (err) => {
        console.error('Failed to remove wishlist title:', err);
      }
    });
  }

  getMainImage(images: ProductImageDTO[] | undefined): string | null {
    if (!images || images.length === 0) return null;
    const mainImage = images.find(img => img.mainImageStatus);
    return mainImage ? mainImage.imgPath! : images[0].imgPath!;
  }

  goToDetail(product: any): void {
    this.router.navigate(['/customer/product', product.id]);
  }
}
