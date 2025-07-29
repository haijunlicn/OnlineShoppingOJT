# Britium Gallery Logo

This directory contains the logo files for the Britium Gallery online shopping application.

## Logo Files

### 1. `britium-gallery-logo.svg` (200x60px)
- **Full logo** with text and icon
- Used for headers, marketing materials, and larger display areas
- Contains the complete "BRITIUM GALLERY" branding with tagline
- Features a shopping bag icon with gallery frame elements

### 2. `britium-gallery-icon.svg` (40x40px)
- **Icon-only version** for smaller spaces
- Used in the admin sidebar, navigation bars, and compact areas
- Circular design with the shopping bag icon
- Maintains brand recognition in limited space

### 3. `favicon.svg` (32x32px)
- **Favicon version** for browser tabs
- Optimized for small display sizes
- Used as the application's browser icon
- Maintains clarity at 16x16px and 32x32px

## Design Elements

### Color Scheme
- **Primary Blue**: `#2563eb` to `#1d4ed8` (gradient)
- **Accent Orange**: `#f59e0b` to `#d97706` (gradient)
- **Text Gray**: `#1f2937` to `#374151` (gradient)
- **Background**: White and light backgrounds

### Icon Design
- **Shopping Bag**: Represents the online shopping aspect
- **Gallery Frames**: Rectangular elements inside the bag represent the gallery concept
- **Decorative Dots**: Yellow dots represent individual gallery items/products
- **Modern Typography**: Clean, professional font styling

## Usage Guidelines

### Where to Use Each Version

1. **Full Logo** (`britium-gallery-logo.svg`):
   - Application headers
   - Marketing materials
   - Print materials
   - Large display areas

2. **Icon Only** (`britium-gallery-icon.svg`):
   - Admin sidebar
   - Navigation menus
   - Mobile app icons
   - Compact spaces

3. **Favicon** (`favicon.svg`):
   - Browser tabs
   - Bookmarks
   - Browser history
   - Desktop shortcuts

### Implementation

The logos are implemented in the following locations:

- **Admin Sidebar**: `src/app/features/admin/common/admin-sidebar/admin-sidebar.component.html`
- **Favicon**: `src/index.html`
- **Assets**: `src/assets/img/`

### CSS Classes

```css
.brand-icon {
  width: 100%;
  height: 100%;
  object-fit: contain;
}
```

## Brand Guidelines

- Maintain aspect ratios when resizing
- Use SVG format for scalability
- Ensure sufficient contrast on backgrounds
- Don't modify colors without brand approval
- Keep clear space around the logo (minimum 10px)

## Technical Specifications

- **Format**: SVG (Scalable Vector Graphics)
- **Color Mode**: RGB
- **Resolution**: Vector (infinitely scalable)
- **File Size**: Optimized for web use
- **Accessibility**: Includes alt text and semantic markup

## Future Considerations

- Consider creating PNG versions for older browser support
- May need different color schemes for dark mode
- Could create animated versions for special use cases
- Consider creating monochrome versions for print 