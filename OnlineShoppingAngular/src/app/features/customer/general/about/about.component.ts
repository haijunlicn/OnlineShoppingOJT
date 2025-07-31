import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-about',
  standalone: false,
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.css']
})
export class AboutComponent {
  
  constructor(private router: Router) {}

  // Timeline for "Our Story"
  timelineData = [
    { year: '2021', description: 'Founded in a small village with a big dream.' },
    { year: '2022', description: 'Moved to Yangon, expanded our product range.' },
    { year: '2023', description: 'Reached 5,000+ happy customers.' },
    { year: '2024', description: 'Opened our first warehouse and hired more team members.' }
  ];

  // Team Quotes
  teamQuotes = [
    { text: 'We treat every order as if it\'s for our own family.', name: 'Aung', role: 'Co-Founder' },
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

  // Team Members
  teamData = [
    { image: 'assets/img/Nan.jpg', name: 'Nan', role: 'Co-Founder' },
    { image: 'assets/img/May.jpg', name: 'May', role: 'Co-Founder' },
    { image: 'assets/img/nyi.jpg', name: 'nyi', role: 'Warehouse Lead' },
    { image: '/assets/img/Su.jpg', name: 'Su', role: 'Customer Support' }
  ];

  // Profile Data
  profileData = {
    name: 'Britium Gallery',
    role: 'Online Shopping Platform',
    stats: [
      { number: '2021', description: 'Founded in a small village' },
      { number: '5000+', description: 'Happy customers served' },
      { number: '10', description: 'Team members strong' }
    ]
  };

  // Biography Text
  bioTexts = [
    'In 2021, we started from a small village with the spirit of delivering high-quality products straight to your home.',
    'With a customer-first mindset, we strive to understand each individual\'s needs and provide the best service possible. Your trust and support have been the most important parts of our journey so far.',
    'We\'re not a big corporation. We\'re your neighbors in Yangon who decided to start something special. When you order from us, you\'re supporting a small team that genuinely cares about every package we send.'
  ];

  // Quotes
  quotes = [
    {
      text: 'In 2021, we started from a small village with the spirit of delivering high-quality products straight to your home.',
      author: null
    },
    {
      text: 'With a customer-first mindset, we strive to understand each individual\'s needs and provide the best service possible.',
      author: null
    },
    {
      text: 'The privilege of doing the extra work is the work itself.',
      author: 'BRITIUM TEAM'
    }
  ];

  // Collaboration Data
  collaboration = {
    text: 'May and I have co-founded this business and implemented our vision together.',
    link: 'Learn more about May'
  };

  // Testimonial
  testimonial = {
    text: 'Britium Gallery grabbed our ideas and quickly developed a distinct online presence for our shopping needs, which can be more than excellent.',
    author: 'HAPPY CUSTOMER',
    categories: ['Customer', 'Local', 'Trusted']
  };

  // Footer Links
  footerLinks = [
    'About Us',
    'Contact',
    'Privacy Policy',
    'Terms of Service',
    'Customer Support'
  ];

  // Social Media
  socialMedia = [
    { name: 'Facebook', icon: 'fab fa-facebook' },
    { name: 'Instagram', icon: 'fab fa-instagram' },
    { name: 'Twitter', icon: 'fab fa-twitter' }
  ];

  // Navigation
  navigation = {
    logo: 'ABOUT US',
    menuText: 'NAVIGATION'
  };

  // Hero Section
  hero = {
    name: 'BRITIUM GALLERY',
    image: '/placeholder.svg?height=600&width=800'
  };

  // Navigation methods
  shopNow() {
    this.router.navigate(['/customer/productList']);
  }

  contactUs() {
    this.router.navigate(['/customer/contact']);
  }

  // Learn more link handler
  learnMoreAboutMay() {
    // Could navigate to a detailed team member page
    console.log('Learn more about May clicked');
  }
}
