import { Component } from '@angular/core';

@Component({
  selector: 'app-about',
  standalone: false,
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.css']
})
export class AboutComponent {
  // Timeline for "Our Story"
  timelineData = [
    { year: '2021', description: 'Founded in a small village with a big dream.' },
    { year: '2022', description: 'Moved to Yangon, expanded our product range.' },
    { year: '2023', description: 'Reached 5,000+ happy customers.' },
    { year: '2024', description: 'Opened our first warehouse and hired more team members.' }
  ];

  // Team Quotes
  teamQuotes = [
    { text: 'We treat every order as if it’s for our own family.', name: 'Aung', role: 'Co-Founder' },
    { text: 'Customer messages make my day!', name: 'May', role: 'Customer Support' },
    { text: 'Packing with care is our secret ingredient.', name: 'Ko Ko', role: 'Warehouse Lead' }
  ];

  // Team Growth Timeline
  teamGrowth = [
    { year: '2021', title: 'Just the Founders', description: 'Started as a two-person team.' },
    { year: '2022', title: 'First Hire', description: 'Welcomed our first team member.' },
    { year: '2023', title: 'Growing Fast', description: 'Expanded to a team of five.' },
    { year: '2024', title: 'Warehouse Team', description: 'Now a team of ten, including delivery and packing staff.' }
  ];

  // Slideshow: A Day in Our Life
  dayInLifeSlides = [
    { image: '/placeholder.svg?height=350&width=600', caption: 'Morning team huddle' },
    { image: '/placeholder.svg?height=350&width=600', caption: 'Packing orders with care' },
    { image: '/placeholder.svg?height=350&width=600', caption: 'Answering customer messages' },
    { image: '/placeholder.svg?height=350&width=600', caption: 'Celebrating a big delivery!' }
  ];
  currentSlide = 0;

  previousSlide() {
    this.currentSlide = (this.currentSlide === 0)
      ? this.dayInLifeSlides.length - 1
      : this.currentSlide - 1;
  }

  nextSlide() {
    this.currentSlide = (this.currentSlide + 1) % this.dayInLifeSlides.length;
  }

  // Mission & Values
  valuesData = [
    { icon: '🤝', title: 'Trust', description: 'We build lasting relationships with honesty and transparency.' },
    { icon: '🌱', title: 'Growth', description: 'We constantly improve ourselves and our service.' },
    { icon: '💡', title: 'Innovation', description: 'We seek new ways to delight our customers.' },
    { icon: '🎯', title: 'Customer First', description: 'Your happiness is our top priority.' }
  ];

  // Team Members
  teamData = [
    { image: '/placeholder.svg?height=90&width=90', name: 'Aung', role: 'Co-Founder' },
    { image: '/placeholder.svg?height=90&width=90', name: 'May', role: 'Co-Founder' },
    { image: '/placeholder.svg?height=90&width=90', name: 'Ko Ko', role: 'Warehouse Lead' },
    { image: '/placeholder.svg?height=90&width=90', name: 'Su', role: 'Customer Support' }
  ];

  // Product Categories
  categoriesData = [
    { icon: '🍚', title: 'Groceries', description: 'Everyday essentials delivered to your door.' },
    { icon: '🍪', title: 'Snacks', description: 'Local and imported treats for every craving.' },
    { icon: '🧴', title: 'Personal Care', description: 'Quality products for your daily routine.' }
  ];

  // Testimonials
  testimonialsData = [
    { text: 'Fast delivery and friendly service. Highly recommend!', author: 'Myo' },
    { text: 'Everything arrived carefully packed. Will order again!', author: 'Ei Mon' },
    { text: 'Best online store in Yangon!', author: 'Zaw' }
  ];

  // Delivery Partners
  deliveryPartners = ['J&T Express', 'Royal Express', 'Yangon Door2Door'];

  // CTA Button Actions
  shopNow() {
    // Example: Navigate to shop page
    window.location.href = '/shop';
  }

  contactUs() {
    // Example: Navigate to contact page
    window.location.href = '/contact';
  }
}
