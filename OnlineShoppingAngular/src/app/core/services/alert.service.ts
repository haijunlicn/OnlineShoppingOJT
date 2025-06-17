import { Injectable } from '@angular/core';
import Swal from 'sweetalert2';

@Injectable({
  providedIn: 'root',
})
export class AlertService {
  success(message: string, title: string = 'Success') {
    Swal.fire({
      title: title,
      text: message,
      icon: 'success',
      confirmButtonText: 'OK',
      customClass: {
        popup: 'luxury-alert',
        confirmButton: 'luxury-btn luxury-btn-primary'
      },
      buttonsStyling: false
    });
  }

  error(message: string, title: string = 'Error') {
    Swal.fire({
      title: title,
      text: message,
      icon: 'error',
      confirmButtonText: 'OK',
      customClass: {
        popup: 'luxury-alert',
        confirmButton: 'luxury-btn luxury-btn-danger'
      },
      buttonsStyling: false
    });
  }

  warning(message: string, title: string = 'Warning') {
    Swal.fire({
      title: title,
      text: message,
      icon: 'warning',
      confirmButtonText: 'OK',
      customClass: {
        popup: 'luxury-alert',
        confirmButton: 'luxury-btn luxury-btn-warning'
      },
      buttonsStyling: false
    });
  }

  info(message: string, title: string = 'Info') {
    Swal.fire({
      title: title,
      text: message,
      icon: 'info',
      confirmButtonText: 'OK',
      customClass: {
        popup: 'luxury-alert',
        confirmButton: 'luxury-btn luxury-btn-info'
      },
      buttonsStyling: false
    });
  }

  // Compact Luxury Toast Notifications
  toast(message: string, icon: 'success' | 'error' | 'warning' | 'info') {
    let iconHtml = '';
    let toastClass = '';

    switch (icon) {
      case 'success':
        iconHtml = '<i class="fas fa-check-circle"></i>';
        toastClass = 'luxury-toast-success';
        break;
      case 'error':
        iconHtml = '<i class="fas fa-times-circle"></i>';
        toastClass = 'luxury-toast-error';
        break;
      case 'warning':
        iconHtml = '<i class="fas fa-exclamation-triangle"></i>';
        toastClass = 'luxury-toast-warning';
        break;
      case 'info':
        iconHtml = '<i class="fas fa-info-circle"></i>';
        toastClass = 'luxury-toast-info';
        break;
    }

    Swal.fire({
      toast: true,
      position: 'top-end',
      html: `
        <div class="luxury-toast-content">
          <div class="luxury-toast-icon">${iconHtml}</div>
          <span class="luxury-toast-message">${message}</span>
        </div>
      `,
      showConfirmButton: false,
      timer: 3500,
      timerProgressBar: true,
      customClass: {
        popup: `luxury-toast ${toastClass}`,
        timerProgressBar: 'luxury-progress-bar'
      },
      didOpen: (toast) => {
        toast.style.animation = 'luxurySlideIn 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        
        toast.addEventListener('mouseenter', () => {
          Swal.stopTimer();
        });
        
        toast.addEventListener('mouseleave', () => {
          Swal.resumeTimer();
        });
      },
      willClose: (toast) => {
        toast.style.animation = 'luxurySlideOut 0.25s cubic-bezier(0.55, 0.06, 0.68, 0.19)';
      }
    });
  }

  // Email Verification Toast (this one can stay larger since it has more content)
  emailNotVerifiedToast(): Promise<boolean> {
    return Swal.fire({
      toast: true,
      position: 'top-end',
      html: `
        <div class="luxury-toast-content-large">
          <div class="luxury-toast-icon-large">
            <i class="fas fa-envelope-open-text"></i>
          </div>
          <div class="luxury-toast-message-large">
            <div class="luxury-toast-title">Email Verification Required</div>
            <div class="luxury-toast-subtitle">Please verify your email to continue</div>
            <button id="verifyNowBtn" class="luxury-toast-btn">
              <i class="fas fa-paper-plane"></i>
              Verify Now
            </button>
          </div>
        </div>
      `,
      showConfirmButton: false,
      timer: 8000,
      timerProgressBar: true,
      customClass: {
        popup: 'luxury-toast luxury-toast-verification',
        timerProgressBar: 'luxury-progress-bar'
      },
      didOpen: (toast) => {
        toast.style.animation = 'luxurySlideIn 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        
        const btn = toast.querySelector('#verifyNowBtn')!;
        btn.addEventListener('click', () => {
          toast.style.animation = 'luxurySlideOut 0.25s cubic-bezier(0.55, 0.06, 0.68, 0.19)';
          setTimeout(() => Swal.close(), 250);
        });

        toast.addEventListener('mouseenter', () => {
          Swal.stopTimer();
        });
        
        toast.addEventListener('mouseleave', () => {
          Swal.resumeTimer();
        });
      },
      willClose: (toast) => {
        toast.style.animation = 'luxurySlideOut 0.25s cubic-bezier(0.55, 0.06, 0.68, 0.19)';
      }
    }).then(result => {
      return !result.dismiss;
    });
  }

  // Luxury Confirmation Dialog
  confirm(message: string, title: string = 'Confirm Action'): Promise<boolean> {
    return Swal.fire({
      title: title,
      text: message,
      showCancelButton: true,
      confirmButtonText: 'Yes, Continue',
      cancelButtonText: 'Cancel',
      customClass: {
        popup: 'luxury-alert luxury-confirm',
        confirmButton: 'luxury-btn luxury-btn-primary',
        cancelButton: 'luxury-btn luxury-btn-outline'
      },
      buttonsStyling: false,
      reverseButtons: true
    }).then(result => {
      return result.isConfirmed;
    });
  }

  // Luxury Loading Toast
  showLoading(message: string = 'Processing...') {
    Swal.fire({
      html: `
        <div class="luxury-loading-content">
          <div class="luxury-spinner">
            <div class="luxury-spinner-ring"></div>
            <div class="luxury-spinner-ring"></div>
            <div class="luxury-spinner-ring"></div>
          </div>
          <div class="luxury-loading-message">${message}</div>
        </div>
      `,
      showConfirmButton: false,
      allowOutsideClick: false,
      allowEscapeKey: false,
      customClass: {
        popup: 'luxury-loading'
      }
    });
  }

  hideLoading() {
    Swal.close();
  }
}