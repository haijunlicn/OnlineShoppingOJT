import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { OrderListComponent } from './order-list.component';
import { OrderService, OrderDetail } from '../../../../core/services/order.service';
import { AuthService } from '../../../../core/services/auth.service';

describe('OrderListComponent', () => {
  let component: OrderListComponent;
  let fixture: ComponentFixture<OrderListComponent>;
  let mockOrderService: jasmine.SpyObj<OrderService>;
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockRouter: jasmine.SpyObj<Router>;

  const mockOrders: OrderDetail[] = [
    {
      id: 1,
      trackingNumber: 'TRK123456789',
      paymentStatus: 'PAID',
      totalAmount: 50000,
      shippingFee: 2000,
      createdDate: '2024-01-15T10:30:00Z',
      updatedDate: '2024-01-15T10:30:00Z',
      paymentProofPath: 'https://example.com/proof.jpg',
      user: {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com'
      },
      shippingAddress: {
        id: 1,
        address: '123 Main St',
        city: 'Yangon',
        township: 'Downtown',
        zipCode: '11111',
        country: 'Myanmar',
        lat: 16.8661,
        lng: 96.1951
      },
      deliveryMethod: {
        id: 1,
        name: 'Car Delivery',
        baseFee: 1000,
        feePerKm: 100
      },
      items: [
        {
          id: 1,
          quantity: 2,
          price: 25000,
          totalPrice: 50000,
          variant: {
            id: 1,
            sku: 'PROD-001',
            price: 25000,
            stock: 10,
            variantName: 'Large',
            imgPath: 'https://example.com/product.jpg'
          },
          product: {
            id: 1,
            name: 'Test Product',
            description: 'Test Description',
            imgPath: 'https://example.com/product.jpg',
            sku: 'PROD-001'
          }
        }
      ],
      statusHistory: []
    },
    {
      id: 2,
      trackingNumber: 'TRK987654321',
      paymentStatus: 'PENDING',
      totalAmount: 30000,
      shippingFee: 1500,
      createdDate: '2024-01-14T15:45:00Z',
      updatedDate: '2024-01-14T15:45:00Z',
      // paymentProofPath: null,
      user: {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
      
      },
      shippingAddress: {
        id: 1,
        address: '123 Main St',
        city: 'Yangon',
        township: 'Downtown',
        zipCode: '11111',
        country: 'Myanmar',
        lat: 16.8661,
        lng: 96.1951
      },
      deliveryMethod: {
        id: 2,
        name: 'Bike Delivery',
        baseFee: 500,
        feePerKm: 50
      },
      items: [
        {
          id: 2,
          quantity: 1,
          price: 30000,
          totalPrice: 30000,
          variant: {
            id: 2,
            sku: 'PROD-002',
            price: 30000,
            stock: 5,
            variantName: 'Medium',
            imgPath: 'https://example.com/product2.jpg'
          },
          product: {
            id: 2,
            name: 'Test Product 2',
            description: 'Test Description 2',
            imgPath: 'https://example.com/product2.jpg',
            sku: 'PROD-002'
          }
        }
      ],
      statusHistory: []
    }
  ];

  const mockUser = {
    id: 1,
    name: 'John Doe',
    email: 'john@example.com',
    phone: '1234567890'
  };

  beforeEach(async () => {
    const orderServiceSpy = jasmine.createSpyObj('OrderService', ['getOrdersByUserId']);
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['initializeUserFromToken', 'getCurrentUser']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      declarations: [ OrderListComponent ],
      providers: [
        { provide: OrderService, useValue: orderServiceSpy },
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    })
    .compileComponents();

    mockOrderService = TestBed.inject(OrderService) as jasmine.SpyObj<OrderService>;
    mockAuthService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    mockRouter = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(OrderListComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should initialize user and load orders when user is authenticated', () => {
      // Arrange
      mockAuthService.initializeUserFromToken.and.returnValue();
      mockAuthService.getCurrentUser.and.returnValue(mockUser);
      mockOrderService.getOrdersByUserId.and.returnValue(of(mockOrders));

      // Act
      component.ngOnInit();

      // Assert
      expect(mockAuthService.initializeUserFromToken).toHaveBeenCalled();
      expect(mockAuthService.getCurrentUser).toHaveBeenCalled();
      expect(component.currentUserId).toBe(1);
      expect(mockOrderService.getOrdersByUserId).toHaveBeenCalledWith(1);
      expect(component.orders).toEqual(mockOrders);
      expect(component.loading).toBeFalse();
      expect(component.error).toBe('');
    });

    it('should set error when user is not authenticated', () => {
      // Arrange
      mockAuthService.initializeUserFromToken.and.returnValue();
      mockAuthService.getCurrentUser.and.returnValue(null);

      // Act
      component.ngOnInit();

      // Assert
      expect(component.error).toBe('User not authenticated');
      expect(component.loading).toBeFalse();
      expect(mockOrderService.getOrdersByUserId).not.toHaveBeenCalled();
    });
  });

  describe('loadOrders', () => {
    it('should load orders successfully', () => {
      // Arrange
      component.currentUserId = 1;
      mockOrderService.getOrdersByUserId.and.returnValue(of(mockOrders));

      // Act
      component.loadOrders();

      // Assert
      expect(component.loading).toBeTrue();
      expect(mockOrderService.getOrdersByUserId).toHaveBeenCalledWith(1);
      
      // Simulate subscription completion
      fixture.detectChanges();
      
      expect(component.orders).toEqual(mockOrders);
      expect(component.loading).toBeFalse();
      expect(component.error).toBe('');
    });

    it('should handle error when loading orders fails', () => {
      // Arrange
      component.currentUserId = 1;
      const errorMessage = 'Failed to load orders';
      mockOrderService.getOrdersByUserId.and.returnValue(throwError(() => new Error(errorMessage)));

      // Act
      component.loadOrders();

      // Assert
      expect(component.loading).toBeTrue();
      expect(mockOrderService.getOrdersByUserId).toHaveBeenCalledWith(1);
      
      // Simulate subscription completion
      fixture.detectChanges();
      
      expect(component.error).toBe('Failed to load orders. Please try again.');
      expect(component.loading).toBeFalse();
    });

    it('should sort orders by date (newest first)', () => {
      // Arrange
      component.currentUserId = 1;
      const unsortedOrders = [...mockOrders].reverse(); // Reverse to test sorting
      mockOrderService.getOrdersByUserId.and.returnValue(of(unsortedOrders));

      // Act
      component.loadOrders();

      // Simulate subscription completion
      fixture.detectChanges();

      // Assert
      expect(component.orders[0].id).toBe(1); // Newest order should be first
      expect(component.orders[1].id).toBe(2); // Older order should be second
    });
  });

  describe('viewOrderDetail', () => {
    it('should navigate to order detail page', () => {
      // Arrange
      const orderId = 123;

      // Act
      component.viewOrderDetail(orderId);

      // Assert
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/customer/orderDetail', orderId]);
    });
  });

  describe('getOrderStatusClass', () => {
    it('should return correct CSS class for different statuses', () => {
      expect(component.getOrderStatusClass('paid')).toBe('badge-success');
      expect(component.getOrderStatusClass('pending')).toBe('badge-warning');
      expect(component.getOrderStatusClass('payment failed')).toBe('badge-danger');
      expect(component.getOrderStatusClass('shipped')).toBe('badge-info');
      expect(component.getOrderStatusClass('delivered')).toBe('badge-success');
      expect(component.getOrderStatusClass('cancelled')).toBe('badge-secondary');
      expect(component.getOrderStatusClass('unknown')).toBe('badge-primary');
      expect(component.getOrderStatusClass('')).toBe('badge-primary');
      expect(component.getOrderStatusClass(null as any)).toBe('badge-primary');
    });
  });

  describe('getOrderStatusIcon', () => {
    it('should return correct icon class for different statuses', () => {
      expect(component.getOrderStatusIcon('paid')).toBe('fas fa-check-circle');
      expect(component.getOrderStatusIcon('pending')).toBe('fas fa-clock');
      expect(component.getOrderStatusIcon('payment failed')).toBe('fas fa-times-circle');
      expect(component.getOrderStatusIcon('shipped')).toBe('fas fa-shipping-fast');
      expect(component.getOrderStatusIcon('delivered')).toBe('fas fa-box-open');
      expect(component.getOrderStatusIcon('cancelled')).toBe('fas fa-ban');
      expect(component.getOrderStatusIcon('unknown')).toBe('fas fa-info-circle');
      expect(component.getOrderStatusIcon('')).toBe('fas fa-info-circle');
      expect(component.getOrderStatusIcon(null as any)).toBe('fas fa-info-circle');
    });
  });

  describe('formatDate', () => {
    it('should format date correctly', () => {
      const dateString = '2024-01-15T10:30:00Z';
      const formatted = component.formatDate(dateString);
      
      // Should contain month, day, and year
      expect(formatted).toContain('Jan');
      expect(formatted).toContain('15');
      expect(formatted).toContain('2024');
    });

    it('should return empty string for invalid date', () => {
      expect(component.formatDate('')).toBe('');
      expect(component.formatDate(null as any)).toBe('');
    });
  });

  describe('formatCurrency', () => {
    it('should format currency correctly', () => {
      const amount = 50000;
      const formatted = component.formatCurrency(amount);
      
      expect(formatted).toContain('MMK');
      expect(formatted).toContain('50,000');
    });

    it('should handle zero amount', () => {
      const formatted = component.formatCurrency(0);
      expect(formatted).toContain('MMK');
      expect(formatted).toContain('0');
    });
  });

  describe('getTotalItems', () => {
    it('should calculate total items correctly', () => {
      const order = mockOrders[0]; // Has 2 items
      const total = component.getTotalItems(order);
      expect(total).toBe(2);
    });

    it('should return 0 for order with no items', () => {
      const orderWithNoItems = { ...mockOrders[0], items: [] };
      const total = component.getTotalItems(orderWithNoItems);
      expect(total).toBe(0);
    });

    it('should return 0 for order with null items', () => {
      const orderWithNullItems = { ...mockOrders[0], items: null as any };
      const total = component.getTotalItems(orderWithNullItems);
      expect(total).toBe(0);
    });
  });

  describe('goBackToHome', () => {
    it('should navigate to home page', () => {
      // Act
      component.goBackToHome();

      // Assert
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/customer/home']);
    });
  });

  describe('trackByOrderId', () => {
    it('should return order id for tracking', () => {
      const order = mockOrders[0];
      const result = component.trackByOrderId(0, order);
      expect(result).toBe(order.id);
    });
  });

  describe('ngOnDestroy', () => {
    it('should unsubscribe from subscriptions', () => {
      // Arrange
      component.currentUserId = 1;
      mockOrderService.getOrdersByUserId.and.returnValue(of(mockOrders));
      component.loadOrders();

      // Act
      component.ngOnDestroy();

      // Assert
      // The component should clean up subscriptions properly
      expect(component['subscriptions'].length).toBe(0);
    });
  });

  describe('Component State', () => {
    it('should have correct initial state', () => {
      expect(component.orders).toEqual([]);
      expect(component.loading).toBeTrue();
      expect(component.error).toBe('');
      expect(component.currentUserId).toBe(0);
    });
  });

  describe('Template Integration', () => {
    it('should display loading state when loading is true', () => {
      component.loading = true;
      fixture.detectChanges();
      
      const loadingElement = fixture.nativeElement.querySelector('.spinner-border');
      expect(loadingElement).toBeTruthy();
    });

    it('should display error state when error exists', () => {
      component.error = 'Test error message';
      component.loading = false;
      fixture.detectChanges();
      
      const errorElement = fixture.nativeElement.querySelector('.alert-danger');
      expect(errorElement).toBeTruthy();
      expect(errorElement.textContent).toContain('Test error message');
    });

    it('should display empty state when no orders', () => {
      component.orders = [];
      component.loading = false;
      component.error = '';
      fixture.detectChanges();
      
      const emptyStateElement = fixture.nativeElement.querySelector('.fa-shopping-bag');
      expect(emptyStateElement).toBeTruthy();
    });

    it('should display orders when available', () => {
      component.orders = mockOrders;
      component.loading = false;
      component.error = '';
      fixture.detectChanges();
      
      const orderElements = fixture.nativeElement.querySelectorAll('tbody tr');
      expect(orderElements.length).toBe(2);
    });
  });
}); 
