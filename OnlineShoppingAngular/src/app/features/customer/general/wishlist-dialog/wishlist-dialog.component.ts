import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { WishlistService } from '../../../../core/services/wishlist.service';
import { WishlistTitleDTO } from '../../../../core/models/wishlist-titleDTO';
import { WishlistDTO } from '../../../../core/models/wishlist-dto';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-wishlist-dialog',
  standalone: false,
  templateUrl: './wishlist-dialog.component.html',
  styleUrls: ['./wishlist-dialog.component.css']
})
export class WishlistDialogComponent implements OnInit {
  wishlistTitles: WishlistTitleDTO[] = [];
  selectedTitleId: number | null = null;
  selectedTitleIds: number[] = [];

  newTitle: string = '';
  userId: number = 4; // TODO: Replace with real auth user ID

  constructor(
    private wishlistService: WishlistService,
    private dialogRef: MatDialogRef<WishlistDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { productId: number }
  ) {}

  ngOnInit(): void {
    this.loadWishlistTitles();
  }

  loadWishlistTitles(): void {
    this.wishlistService.getWishlistTitles(this.userId).subscribe({
      next: (titles) => {
        console.log("title : ", titles);
        this.wishlistTitles = titles;
      },
      error: (err) => {
        console.error('Failed to load wishlist titles:', err);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to load wishlist titles.'
        });
      }
    });
  }

  logSelectedTitleIds(): void {
    console.log('Selected Title IDs:', this.selectedTitleIds);
  }

  createNewTitle(): void {
    if (!this.newTitle.trim()) return;

    const dto: WishlistTitleDTO = {
      userId: this.userId,
      title: this.newTitle.trim()
    };

    this.wishlistService.createWishlistTitle(dto).subscribe({
      next: () => {
        this.newTitle = '';
        this.loadWishlistTitles();
        Swal.fire({
          icon: 'success',
          title: 'Wishlist Created',
          text: 'New wishlist title has been created successfully.'
        });
      },
      error: (err) => {
        console.error('Error creating new title:', err);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to create new wishlist title.'
        });
      }
    });
  }

  confirmAdd(): void {
    if (this.selectedTitleIds.length === 0) return;

    console.log("selected title ids : ", this.selectedTitleIds);

    const dtoList: WishlistDTO[] = this.selectedTitleIds.map(id => ({
      wishlistTitleId: id,
      productId: this.data.productId
    }));

    console.log("📦 DTO List to submit:", dtoList);

    let successCount = 0;
    let errorCount = 0;

    dtoList.forEach(dto => {
      this.wishlistService.addProductToWishlist(dto).subscribe({
        next: () => {
          console.log(`✅ Product added to wishlist ID ${dto.wishlistTitleId}`);
          successCount++;
          if (successCount + errorCount === dtoList.length) {
            this.showAddResult(successCount, errorCount);
          }
        },
        error: (err) => {
          console.error(`❌ Failed to add to wishlist ID ${dto.wishlistTitleId}`, err);
          errorCount++;
          if (successCount + errorCount === dtoList.length) {
            this.showAddResult(successCount, errorCount);
          }
        }
      });
    });
  }

  private showAddResult(successCount: number, errorCount: number): void {
    if (errorCount === 0) {
      Swal.fire({
        icon: 'success',
        title: 'Success',
        text: `✅ Product added to ${successCount} wishlist(s)!`
      });
      this.dialogRef.close({ added: true });
    } else if (successCount === 0) {
      Swal.fire({
        icon: 'error',
        title: 'Failed',
        text: `❌ Failed to add product to all selected wishlists.`
      });
    } else {
      Swal.fire({
        icon: 'warning',
        title: 'Partial Success',
        html: `✅ Added to ${successCount} wishlist(s)<br>❌ Failed to add to ${errorCount} wishlist(s)`
      });
      this.dialogRef.close({ added: successCount > 0 });
    }
  }
}
