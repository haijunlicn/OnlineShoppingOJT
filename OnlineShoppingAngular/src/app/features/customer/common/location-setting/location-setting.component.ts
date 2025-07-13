import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { User } from '@app/core/models/User';


interface Address {
  id: string
  type: string
  name: string
  address: string
  city: string
  state: string
  zipCode: string
  isDefault: boolean
}

@Component({
  selector: "app-location-setting",
  standalone: false,
  templateUrl: "./location-setting.component.html",
  styleUrls: ["./location-setting.component.css"],
})
export class LocationSettingComponent implements OnInit {
  @Input() currentUser: User | null = null;

  addresses: Address[] = []
  addressForm: FormGroup
  isUpdating = false
  showAddressModal = false
  editingAddress: Address | null = null
  successMessage = ""
  errorMessage = ""

  constructor(private fb: FormBuilder) {
    this.addressForm = this.fb.group({
      type: ["", [Validators.required]],
      name: ["", [Validators.required]],
      address: ["", [Validators.required]],
      city: ["", [Validators.required]],
      state: ["", [Validators.required]],
      zipCode: ["", [Validators.required]],
    })
  }

  ngOnInit(): void {
    this.loadAddresses()
  }

  loadAddresses(): void {
    // Mock data - replace with actual API call
    this.addresses = [
      {
        id: "1",
        type: "Home",
        name: "John Doe",
        address: "123 Main Street",
        city: "Yangon",
        state: "Yangon Region",
        zipCode: "11181",
        isDefault: true,
      },
      {
        id: "2",
        type: "Office",
        name: "John Doe",
        address: "456 Business Ave",
        city: "Yangon",
        state: "Yangon Region",
        zipCode: "11182",
        isDefault: false,
      },
    ]
  }

  openAddressModal(address?: Address): void {
    this.editingAddress = address || null
    this.showAddressModal = true
    this.clearMessages()

    if (address) {
      this.addressForm.patchValue({
        type: address.type,
        name: address.name,
        address: address.address,
        city: address.city,
        state: address.state,
        zipCode: address.zipCode,
      })
    } else {
      this.addressForm.reset()
    }
  }

  closeAddressModal(): void {
    this.showAddressModal = false
    this.editingAddress = null
    this.clearMessages()
  }

  onAddressSubmit(): void {
    if (this.addressForm.valid) {
      this.isUpdating = true
      this.clearMessages()

      const formData = this.addressForm.value

      setTimeout(() => {
        if (this.editingAddress) {
          // Update existing address
          const index = this.addresses.findIndex((addr) => addr.id === this.editingAddress!.id)
          if (index !== -1) {
            this.addresses[index] = { ...this.editingAddress, ...formData }
          }
          this.successMessage = "Address updated successfully!"
        } else {
          // Add new address
          const newAddress: Address = {
            id: Date.now().toString(),
            ...formData,
            isDefault: this.addresses.length === 0,
          }
          this.addresses.push(newAddress)
          this.successMessage = "Address added successfully!"
        }

        this.isUpdating = false
        setTimeout(() => this.closeAddressModal(), 1500)
      }, 1000)
    } else {
      this.markFormGroupTouched(this.addressForm)
    }
  }

  setDefaultAddress(address: Address): void {
    this.addresses.forEach((addr) => (addr.isDefault = false))
    address.isDefault = true
    this.successMessage = "Default address updated successfully!"
    setTimeout(() => this.clearMessages(), 3000)
  }

  deleteAddress(address: Address): void {
    if (confirm("Are you sure you want to delete this address?")) {
      this.addresses = this.addresses.filter((addr) => addr.id !== address.id)
      this.successMessage = "Address deleted successfully!"
      setTimeout(() => this.clearMessages(), 3000)
    }
  }

  private clearMessages(): void {
    this.successMessage = ""
    this.errorMessage = ""
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach((key) => {
      const control = formGroup.get(key)
      control?.markAsTouched()
    })
  }

  getFieldError(form: FormGroup, fieldName: string): string {
    const field = form.get(fieldName)
    if (field?.errors && field.touched) {
      if (field.errors["required"]) {
        return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} is required`
      }
    }
    return ""
  }
}

