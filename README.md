# DailyCart — Online Grocery Delivery Platform

<p align="center">
  <img src="public/dailycart_login_logo.png" alt="DailyCart Logo" width="220" />
</p>

<p align="center">
  **Your Daily Essentials, Delivered Fresh.**
</p>

<p align="center">
  A modern, mobile-first online grocery delivery platform built to make everyday shopping simple, convenient, and reliable.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16.4.6-black?logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/React-19-blue?logo=react" alt="React" />
  <img src="https://img.shields.io/badge/Firebase-Backend-orange?logo=firebase" alt="Firebase" />
  <img src="https://img.shields.io/badge/Platform-Web%20%7C%20PWA-green" alt="Platform" />
  <img src="https://img.shields.io/badge/Status-Production%20Preparation-success" alt="Status" />
</p>

---

## Table of Contents

- [Overview](#overview)
- [Project Information](#project-information)
- [Key Features](#key-features)
- [Technology Stack](#technology-stack)
- [Application Architecture](#application-architecture)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Configuration](#environment-configuration)
- [Firebase Configuration](#firebase-configuration)
- [Authentication](#authentication)
- [Customer Application Routes](#customer-application-routes)
- [Shopping and Checkout](#shopping-and-checkout)
- [Order Management](#order-management)
- [Delivery Experience](#delivery-experience)
- [Progressive Web App](#progressive-web-app)
- [Android Integration](#android-integration)
- [Delivery and Pricing Policy](#delivery-and-pricing-policy)
- [Security](#security)
- [Testing](#testing)
- [Build and Deployment](#build-and-deployment)
- [Production Checklist](#production-checklist)
- [Troubleshooting](#troubleshooting)
- [Future Improvements](#future-improvements)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

**DailyCart** is a customer-facing online grocery shopping and delivery platform designed for convenient local shopping.

The platform allows customers to explore available grocery products, manage their shopping carts, place orders, track deliveries, and manage their accounts through a responsive web application.

DailyCart focuses on:

- A clean and intuitive shopping experience.
- Mobile-first and responsive interface design.
- Secure customer authentication.
- Reliable order processing.
- Real-time data synchronization through Firebase.
- Location-aware delivery experiences.
- Progressive Web App support.
- Android application integration.

The platform is initially focused on serving customers in and around **Chabua, Assam**, with a local delivery operating radius.

### Live Application

| Resource | URL |
|---|---|
| Customer Website | https://getbaskit.netlify.app/ |
| GitHub Repository | https://github.com/redux-next/dailycart |
| Android Application | Separate Android repository |
| Admin Dashboard | Separate admin application |

> The Netlify URL is the current deployment endpoint. Update the production URL here when the custom domain becomes active.

---

## Project Information

| Property | Details |
|---|---|
| Project Name | DailyCart |
| Application Type | Online Grocery Delivery |
| Platform | Customer Web Application |
| Framework | Next.js |
| Framework Version | 16.4.6 |
| Package Version | 0.1.0 |
| Backend | Firebase |
| Authentication | Firebase Authentication |
| Database | Cloud Firestore |
| Storage | Firebase Storage |
| Hosting | Netlify |
| Android Integration | Android WebView |
| Package Name | `dailycart` |
| Primary Market | Chabua, Assam, India |
| Repository | `redux-next/dailycart` |

---

## Key Features

### 1. Customer Authentication

DailyCart provides a secure authentication experience using Firebase Authentication.

Supported authentication features include:

- Google Sign-In.
- Email and password registration.
- Email and password login.
- Password reset.
- Authentication state management.
- Secure session handling.
- Firebase ID token refresh.
- Customer profile completion.

### 2. Grocery Shopping

Customers can browse available grocery products and add items to their shopping cart.

Shopping functionality includes:

- Product browsing.
- Product information and pricing.
- Add-to-cart functionality.
- Quantity management.
- Cart item removal.
- Cart total calculation.
- Order checkout.

### 3. Customer Dashboard

The customer dashboard provides a central location for accessing shopping and account functionality.

Features include:

- Personalized customer experience.
- Responsive dashboard layout.
- Promotional banner.
- Shopping shortcuts.
- Account navigation.
- Order access.
- Delivery-related information.
- Mobile and PWA optimized interface.

### 4. Shopping Cart

The shopping cart allows customers to review their selected products before checkout.

Features include:

- Product quantity updates.
- Item removal.
- Subtotal calculation.
- Delivery charge calculation.
- Handling fee calculation.
- Final payable amount.

### 5. Checkout

The checkout process collects the information required to place a grocery order.

Includes:

- Customer information.
- Delivery address.
- Pincode information.
- Order summary.
- Delivery charges.
- Payment method selection.
- Order submission.

### 6. Order Management

Customers can access their order information through a dedicated order management interface.

Features include:

- Order history.
- Order details.
- Order status.
- Order tracking.
- Order identification.
- Order completion information.

### 7. Delivery Tracking

DailyCart provides delivery-related functionality to help customers follow their orders.

Features include:

- Dedicated order tracking page.
- Delivery status visibility.
- Delivery information.
- Order-specific tracking.

### 8. Customer Account Management

Customers can manage their account information and profile.

Features include:

- Customer profile.
- Address information.
- Pincode.
- Location information.
- Profile completion.
- Account management.
- Account deletion functionality.

### 9. Progressive Web App

DailyCart supports Progressive Web App functionality.

PWA capabilities include:

- Web app manifest.
- Service worker.
- Application icons.
- Installable application experience.
- Mobile-optimized navigation.
- Cached application assets.
- Standalone display mode.

### 10. Responsive Design

The application is designed for multiple screen sizes.

Supported experiences include:

- Desktop browsers.
- Laptop screens.
- Tablets.
- Mobile browsers.
- Android WebView.
- Installed PWA.

The interface prioritizes a compact, user-friendly mobile experience without compromising desktop usability.

---

## Technology Stack

| Technology | Purpose |
|---|---|
| Next.js 16 | Application framework |
| React | User interface |
| JavaScript | Application development |
| CSS | Styling and responsive layouts |
| Firebase Authentication | Customer authentication |
| Cloud Firestore | Application database |
| Firebase Storage | File and image storage |
| Firebase Admin SDK | Trusted server-side operations |
| Netlify | Web hosting and deployment |
| Service Workers | PWA functionality |
| Android WebView | Native Android integration |
| Git and GitHub | Version control |

---

## Application Architecture

DailyCart follows a modern web application architecture.

```text
                    DailyCart
                        |
             Customer Web Application
                        |
                    Next.js
                        |
              React Components
                        |
          ----------------------------
          |             |            |
       Customer       Shopping     Account
       Dashboard       Cart        Management
          |             |            |
          ----------------------------
                        |
                 Firebase Services
                        |
          ----------------------------
          |             |            |
       Firebase      Firestore    Storage
        Auth          Database
          |
       Customer
     Authentication

          |
     Deployment
          |
       Netlify
          |
    Customer Website
          |
     Android WebView
```

The customer application communicates with Firebase services for authentication, data access, and supported backend operations.

Sensitive administrative operations must remain server-side.

---

## Project Structure

The following represents the main application organization. Individual files and directories may evolve as development continues.

```text
dailycart/
│
├── public/
│   ├── dailycart-logo.png
│   ├── dailycart_icon.png
│   ├── manifest.json
│   ├── sw.js
│   └── ...
│
├── src/
│   │
│   ├── app/
│   │   ├── cart/
│   │   ├── checkout/
│   │   ├── complete-profile/
│   │   ├── delivery/
│   │   ├── orders/
│   │   ├── track-order/
│   │   │   └── [orderId]/
│   │   ├── login/
│   │   ├── globals.css
│   │   └── ...
│   │
│   ├── components/
│   │   ├── home-client
│   │   ├── mobile-bottom-nav
│   │   ├── public-site-chrome
│   │   ├── pwa-register
│   │   └── ...
│   │
│   └── ...
│
├── .gitignore
├── eslint.config.mjs
├── next.config.mjs
├── package.json
├── package-lock.json
├── README.md
└── ...
```

---

## Getting Started

Follow these steps to run DailyCart locally.

### Prerequisites

Install the following:

- Node.js 24.x recommended.
- npm.
- Git.
- A Firebase project.
- A code editor such as Visual Studio Code.

Check your installed versions:

```bash
node -v
npm -v
git --version
```

### 1. Clone the Repository

```bash
git clone https://github.com/redux-next/dailycart.git
```

### 2. Navigate to the Project

```bash
cd dailycart
```

Use the actual directory created by your clone command if it differs.

### 3. Install Dependencies

```bash
npm install
```

### 4. Configure Environment Variables

Create a `.env.local` file in the project root.

Add the Firebase configuration variables required by the application.

### 5. Start the Development Server

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

The application should now be accessible locally.

---

## Environment Configuration

DailyCart uses environment variables for Firebase configuration and server-side services.

Create a `.env.local` file in the root directory.

Example configuration:

```env
# Firebase Client Configuration

NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Firebase Admin Configuration
# Use the exact variable names referenced by your server-side code.

FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
```

> Important: The environment variable names above are a configuration reference. Verify them against the actual Firebase initialization files in the repository before deployment. Do not create duplicate variables if the project already uses different names.

### Environment Variable Security

- Never commit `.env.local`.
- Never expose Firebase Admin credentials to client-side code.
- Never publish service account private keys.
- Configure production secrets through the hosting provider.
- Use separate configurations for development and production where appropriate.

---

## Firebase Configuration

DailyCart uses Firebase as its backend infrastructure.

### Firebase Authentication

Firebase Authentication handles:

- Google authentication.
- Email and password authentication.
- Password reset.
- User session management.
- Authentication token management.

### Cloud Firestore

Cloud Firestore stores application data.

The application uses customer documents under:

```text
/users/{uid}
```

Customer profile information can include:

- Customer name.
- Email.
- Address.
- Pincode.
- Latitude.
- Longitude.
- Location accuracy.
- Location source.
- Profile completion status.

Other application collections should follow the schemas and access rules implemented in the application.

### Firebase Storage

Firebase Storage supports application file and image storage.

Storage access must be restricted using appropriate Firebase Storage Security Rules.

### Firebase Security Rules

Firestore and Storage Security Rules must enforce authentication and authorization.

Never rely exclusively on client-side checks to protect customer or administrative data.

---

## Authentication

DailyCart uses Firebase Authentication for customer access.

### Authentication Flow

```text
Customer Opens Application
          |
          v
   Authentication Check
          |
      ------------
      |          |
 Authenticated  Guest
      |          |
      v          v
 Customer      Login /
 Dashboard     Register
      |
      v
 Profile Completion Check
      |
      v
 Customer Experience
```

### Role-Based Access

Delivery access must be verified through trusted Firebase authentication claims.

The delivery dashboard must not rely solely on a customer Firestore document field such as `deliveryBoy`.

The application should refresh the Firebase ID token and verify the `deliveryBoy` claim before granting delivery-specific access.

Administrative authorization must also be enforced through trusted server-side checks.

---

## Customer Application Routes

| Route | Description |
|---|---|
| `/` | Customer homepage and dashboard |
| `/login` | Customer authentication |
| `/cart` | Shopping cart |
| `/checkout` | Checkout and order placement |
| `/complete-profile` | Customer profile completion |
| `/orders` | Customer order history |
| `/track-order/[orderId]` | Individual order tracking |
| `/delivery` | Authorized delivery dashboard |

Routes may require authentication depending on their functionality.

---

## Shopping and Checkout

The shopping experience follows a straightforward process.

```text
Browse Products
       |
       v
Add Products to Cart
       |
       v
Review Shopping Cart
       |
       v
Proceed to Checkout
       |
       v
Confirm Delivery Address
       |
       v
Review Order Summary
       |
       v
Place Order
       |
       v
Order Confirmation
```

The application calculates the order subtotal, applicable delivery charges, handling fees, and final payable amount.

The server must validate product prices, quantities, and order totals rather than trusting values submitted by the browser.

---

## Order Management

Each order should have a unique order identifier.

Order information may include:

- Order ID.
- Customer UID.
- Product details.
- Product quantities.
- Item subtotal.
- Delivery charges.
- Handling charges.
- Total payable amount.
- Payment method.
- Payment status.
- Order status.
- Delivery information.
- Creation timestamp.

### Order Idempotency

Order creation must protect against accidental duplicate submissions.

The project includes an order idempotency test script to validate this behavior.

Order processing should be handled through trusted backend operations and transactional safeguards where appropriate.

---

## Delivery Experience

DailyCart provides delivery-related functionality for authorized delivery personnel.

Delivery access is controlled using Firebase custom claims.

The delivery experience must ensure:

- Only authorized delivery personnel can access delivery-specific functionality.
- Authentication claims are refreshed before authorization.
- Customer and delivery permissions remain separate.
- Order information is protected through Firebase Security Rules and backend authorization.

---

## Progressive Web App

DailyCart supports installation as a Progressive Web App.

### Main PWA Files

| File | Purpose |
|---|---|
| `public/manifest.json` | PWA application metadata |
| `public/sw.js` | Service worker |
| `public/dailycart_icon.png` | Application icon |
| `src/components/pwa-register` | Service worker registration |

### PWA Benefits

- Installable application experience.
- Standalone display.
- Application branding.
- Mobile-friendly interface.
- Improved access to frequently used application resources.

Service worker caching should be configured carefully to prevent stale customer data, outdated application versions, or cached authenticated content from being exposed.

---

## Android Integration

DailyCart also has a separate Android application.

The Android project integrates the customer website through Android WebView.

### Android Information

| Property | Details |
|---|---|
| Application Name | DailyCart |
| Android Package | `com.getbaskit.customer` |
| Application Framework | Native Android |
| Language | Kotlin |
| Website Integration | Android WebView |
| Authentication | Firebase Authentication |
| Google Sign-In | Credential Manager |
| Current Website | `https://getbaskit.netlify.app/` |

### Integration Features

- Native Android application shell.
- WebView-based customer experience.
- Google Sign-In integration.
- Firebase authentication integration.
- Location permissions.
- File chooser support.
- Loading indicators.
- Branded application experience.

The Android application currently uses the Netlify deployment URL.

When the final customer domain becomes active, update the Android WebView URL, trusted host configuration, and any associated authentication or deep-link configurations.

**Android Repository:** https://github.com/redux-next/dailycart-android

---

## Delivery and Pricing Policy

DailyCart initially operates within its local delivery service area.

| Policy | Details |
|---|---|
| Primary Service Area | Chabua Town |
| Delivery Coverage | Within approximately 10 km |
| Delivery Target | Approximately 10 minutes |
| Free Delivery Threshold | Orders of ₹299 or above |
| Standard Delivery Charge | ₹19 |
| Handling Fee | ₹4 |
| Cash on Delivery | Available for orders above ₹100 |

Delivery availability and estimated delivery time depend on operational conditions.

Pricing and delivery policies should always be validated against the current production configuration before being changed.

---

## Security

Security is a critical part of the DailyCart architecture.

### Application Security

- Firebase Authentication for customer identity.
- Firebase Security Rules for database access.
- Restricted Firebase Storage access.
- Server-side validation of sensitive operations.
- Secure handling of environment variables.
- Role-based authorization.
- ID token refresh before protected access.
- Order creation idempotency.
- Protection against unauthorized administrative operations.

### Production Security Recommendations

1. Never expose Firebase Admin credentials.
2. Never trust client-submitted order totals.
3. Validate all customer inputs.
4. Restrict database access using Firestore Security Rules.
5. Restrict storage access using Storage Security Rules.
6. Verify user permissions on the server.
7. Avoid exposing sensitive customer information.
8. Use HTTPS for all production communication.
9. Test security rules before deployment.
10. Keep dependencies updated.

---

## Testing

DailyCart includes automated scripts for important backend security and order-processing checks.

### Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Build production application |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run test:firebase-rules` | Test Firestore and Storage security rules |
| `npm run test:order-idempotency` | Test order creation idempotency |

### Run Firebase Security Tests

```bash
npm run test:firebase-rules
```

### Run Order Idempotency Tests

```bash
npm run test:order-idempotency
```

These tests use the Firebase Emulator Suite and the configured demo project.

Run the relevant tests before deploying changes affecting authentication, database access, or order processing.

---

## Build and Deployment

DailyCart uses Netlify for customer website hosting.

### Production Build

Before deploying, run:

```bash
npm install
npm run lint
npm run build
```

Resolve all build and lint errors before publishing.

### Deployment Through Netlify

1. Open the Netlify dashboard.
2. Select the DailyCart customer website.
3. Connect the GitHub repository if it is not already connected.
4. Configure the production branch as `main`.
5. Configure the required environment variables.
6. Verify the Next.js build configuration.
7. Trigger a production deployment.
8. Verify the deployed customer website.

### Recommended Deployment Configuration

| Setting | Value |
|---|---|
| Repository | `redux-next/dailycart` |
| Production Branch | `main` |
| Build Command | `npm run build` |
| Package Manager | npm |
| Node.js | 24.x |
| Hosting | Netlify |
| Deployment Type | Production |

Use the Netlify Next.js runtime and deployment integration appropriate for the project's Next.js version. Do not replace the configured Next.js deployment adapter with a generic static export unless the application has been specifically adapted for static hosting.

### Custom Domain

The intended customer-facing domain is:

```text
dailycart.in
```

After domain configuration:

- Configure DNS records.
- Enable HTTPS.
- Verify the production domain.
- Update the Android WebView URL.
- Verify Firebase authorized domains.
- Verify authentication redirects.
- Update canonical URLs and metadata where required.

---

## Production Checklist

Before releasing updates, verify the following:

### Application

- [ ] Customer homepage loads correctly.
- [ ] Dashboard is responsive.
- [ ] Mobile layout works correctly.
- [ ] PWA installation works.
- [ ] Navigation links work.
- [ ] Customer footer links are visible.
- [ ] Privacy Policy is accessible.
- [ ] Contact information is accessible.

### Authentication

- [ ] Google Sign-In works.
- [ ] Email authentication works.
- [ ] Password reset works.
- [ ] Session persistence works.
- [ ] Profile completion works.
- [ ] Protected routes are secured.

### Shopping

- [ ] Products display correctly.
- [ ] Cart functionality works.
- [ ] Product quantities update correctly.
- [ ] Checkout calculations are correct.
- [ ] Delivery charges are correct.
- [ ] Order placement works.
- [ ] Duplicate orders are prevented.

### Orders and Delivery

- [ ] Orders appear in customer history.
- [ ] Order tracking works.
- [ ] Order status is accurate.
- [ ] Delivery authorization works.
- [ ] Unauthorized access is blocked.

### Infrastructure

- [ ] Firebase Security Rules are tested.
- [ ] Firebase Storage Rules are tested.
- [ ] Production environment variables are configured.
- [ ] Production build succeeds.
- [ ] HTTPS is enabled.
- [ ] Android integration is verified.
- [ ] Custom domain is configured when available.

---

## Troubleshooting

### Firebase Authentication Not Working

Check:

- Firebase API configuration.
- Authorized domains.
- Google Sign-In provider configuration.
- OAuth configuration.
- Firebase Authentication settings.

### Google Sign-In Errors

Verify:

- Correct Firebase project.
- OAuth client configuration.
- Authorized domains.
- Android SHA fingerprints where applicable.
- Google Cloud OAuth consent and client configuration.

### Firestore Permission Errors

Check:

- Firebase Authentication state.
- Firestore Security Rules.
- User UID.
- Required custom claims.
- Server-side authorization.

### Netlify Build Errors

Check:

```bash
npm install
npm run lint
npm run build
```

Also verify:

- Node.js version.
- Environment variables.
- Package lockfile.
- Next.js configuration.
- Firebase Admin initialization.
- Server-side environment configuration.

### Android Website Not Updating

Check:

- Latest Netlify deployment status.
- WebView URL.
- Android cache.
- Service worker cache.
- Trusted host configuration.

---

## Future Improvements

Potential future development areas include:

- Custom domain migration.
- Enhanced product discovery.
- Product categories and filtering.
- Improved search experience.
- Customer notifications.
- Enhanced delivery tracking.
- More payment gateway integrations.
- Customer loyalty and rewards.
- Improved order analytics.
- Performance optimization.
- Accessibility improvements.
- Expanded delivery coverage.

These are development opportunities and should not be interpreted as currently implemented features.

---

## Contributing

Contributions and improvements are welcome.

For development:

1. Fork or clone the repository.
2. Create a feature branch.
3. Make your changes.
4. Run lint and relevant tests.
5. Verify the production build.
6. Commit your changes.
7. Submit a pull request.

### Branch Naming

Recommended naming conventions:

```text
feature/feature-name
fix/issue-name
refactor/component-name
docs/documentation-update
```

### Commit Message Convention

Use clear, descriptive commit messages.

Examples:

```text
feat: add customer shopping functionality
fix: resolve checkout calculation issue
refactor: improve dashboard responsiveness
style: refine mobile dashboard layout
docs: update customer application README
chore: prepare DailyCart for production
```

---

## License

This project is proprietary software.

All rights are reserved by the project owner unless explicitly stated otherwise.

Unauthorized copying, redistribution, modification, or commercial use is not permitted without prior written permission.

---

## Project Identity

<p align="center">
  **DailyCart**
  <br />
  Your Daily Essentials, Delivered Fresh.
  <br /><br />
  Built for convenient local grocery shopping.
  <br /><br />
  <a href="https://getbaskit.netlify.app/">Visit DailyCart</a>
  &nbsp; · &nbsp;
  <a href="https://github.com/redux-next/dailycart">GitHub Repository</a>
</p>

---

<p align="center">
  © 2026 DailyCart. All Rights Reserved.
</p>
