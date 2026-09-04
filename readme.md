# Barakah Islamic E-Commerce Platform

A full-stack MERN e-commerce platform for selling Islamic wall decor products such as wall clocks, canvas, wall art, and related products.

The platform includes a customer storefront, admin dashboard, product and order management, analytics, courier integrations, authentication, reviews, and marketing analytics.

---

## Tech Stack

### Frontend

- Next.js (App Router)
- React
- Tailwind CSS
- DaisyUI
- Google Tag Manager
- Meta Pixel

### Backend

- Node.js
- Express.js
- MongoDB
- Cloudinary
- Steadfast Courier API
- Pathao Courier API
- Bangladesh Delivery Corporation (BDC) API

---

## Project Structure


barakah-demo-project/
├── barakah-client/          # Next.js frontend
├── barakah-server/          # Express.js backend
├── .gitignore
└── README.md

---

# Features

## Customer Storefront

* Dynamic homepage
* Product categories and subcategories
* Product search
* Product details
* Related products
* Shopping cart
* Persistent cart
* Checkout
* Customer order placement
* bKash payment option
* Nagad payment option
* Cash on Delivery
* Customer reviews

## Authentication

* User registration
* User login
* Authentication state management
* Role-based access control
* Protected admin dashboard

## Admin Dashboard

### Product Management

* Add products
* Upload product images
* Edit products
* Delete products
* Update inventory
* Product pagination

### Order Management

* View orders
* Search and filter orders
* View order details
* Update order status
* Mark orders as delivered
* Send orders to courier services

### Analytics

* Total orders
* Revenue analytics
* Delivered revenue
* Cancelled revenue
* Date-based analytics
* Custom date-range filtering
* Order status statistics
* CSV order export

### Courier Integration

The backend supports courier integrations for order dispatch and tracking.

Configured integrations include:

* Steadfast
* Pathao
* BD Courier for Fraud Checking

Courier API credentials must be configured through environment variables.

---

# Analytics & Tracking

The frontend includes:

* Google Tag Manager
* Meta Pixel
* Product view tracking
* Add-to-cart tracking
* Purchase/order tracking
* UTM tracking

Analytics credentials and IDs must be configured through environment variables.

---

# Backend API

The frontend communicates with the Express backend through the API URL configured in:

#env

NEXT_PUBLIC_API_URL


## Products


GET     /api/products
GET     /api/products/:id
POST    /api/products
PATCH   /api/products/:id
DELETE  /api/products/:id


## Orders

GET     /api/orders
POST    /api/orders
PATCH   /api/orders/:id/deliver
POST    /api/orders/:id/steadfast
GET     /api/orders/analytics
GET     /api/orders/analytics/byDate
GET     /api/orders/analytics/delivered
POST    /api/orders/export/csv

## Authentication

POST    /api/auth/register
POST    /api/auth/login

## Reviews

GET     /api/reviews

---

# Requirements

## Recommended Node.js Version

Node.js 20.x or newer.

The project has been tested with Node.js 20.

## Frontend

* Node.js
* npm

## Backend

* Node.js
* npm
* MongoDB / MongoDB Atlas

---

# Local Development Setup

## 1. Clone the repository

git clone <REPOSITORY_URL>
cd barakah-demo-project

---

# Frontend Setup

cd barakah-client
npm install

Create a `.env.local` file based on:

.env.example

Example:

NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your_cloudinary_upload_preset
NEXT_PUBLIC_API_URL=http://localhost:8000

### Development

The project can be started with Webpack using:

npm run dev -- --webpack

Then open:

http://localhost:3000

### Production Build

npm run build

Start the production server:

npm start

---

# Backend Setup

cd barakah-server
npm install

Create a `.env` file based on:

.env.example

Example:

PORT=8000

DB_NAME=your_database_name
MONGODB_URI=your_mongodb_connection_string

STEADFAST_API_URL=https://portal.packzy.com/api/v1
STEADFAST_API_KEY_NARAYANGANJ=your_api_key
STEADFAST_SECRET_KEY_NARAYANGANJ=your_secret_key

STEADFAST_API_KEY_BADDA=your_api_key
STEADFAST_SECRET_KEY_BADDA=your_secret_key

STEADFAST_API_KEY_JAMALPUR=your_api_key
STEADFAST_SECRET_KEY_JAMALPUR=your_secret_key

GMAIL_USER=your_email@gmail.com
GMAIL_APP_PASSWORD=your_app_password
ADMIN_EMAIL=your_admin_email@gmail.com

BDC_API_KEY=your_bdc_api_key

PATHAO_BASE_URL=https://api-hermes.pathao.com
PATHAO_CLIENT_ID=your_client_id
PATHAO_CLIENT_SECRET=your_client_secret
PATHAO_USERNAME=your_username
PATHAO_PASSWORD=your_password
PATHAO_STORE_ID=your_store_id

### Start Backend

npm start

For development:

npm run dev

The backend will run on the port configured in `.env`.

---

# Environment Variables

The repository contains:

.env.example

for both the frontend and backend.

The actual environment files are intentionally excluded from Git.

Never commit:

.env
.env.local
.env.production

Environment variables must be configured separately for each deployment environment.

---

# Database

The application uses MongoDB.

MongoDB can be hosted through:

* MongoDB Atlas
* A self-hosted MongoDB server

The MongoDB connection string is configured through:

MONGODB_URI

The database credentials are not included in this repository.

---

# Image Storage

Product images are uploaded through Cloudinary.

Configure the frontend Cloudinary variables in:

barakah-client/.env.local

Required variables:

NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your_cloudinary_upload_preset

---

# Production Deployment

The application consists of two services:

Frontend
Next.js
     ↓
Backend
Express.js
     ↓
MongoDB


For shared hosting/cPanel deployment, the frontend and backend should be configured as Node.js applications.

### Frontend

The Next.js application should run in production mode:

npm run build
npm start

### Backend

The Express application should run using its configured startup file and production environment variables.

The exact cPanel configuration depends on the hosting provider's Node.js application settings.

---

# Security

Never expose or commit:

* MongoDB credentials
* JWT secrets
* Courier API keys
* Courier secret keys
* Gmail app passwords
* Cloudinary API secrets
* BDC API keys
* Pathao credentials
* Other private API credentials

Use environment variables for all sensitive configuration.

---

# Important Deployment Notes

### Courier APIs

Some courier integrations may require server IP whitelisting.

The hosting/server public IP may need to be provided to the courier provider before the API can be used.

### CORS

The backend must allow requests from the production frontend domain.

Update the backend CORS configuration when changing the frontend domain.

### API URL

The production frontend must use the production backend URL:

NEXT_PUBLIC_API_URL=https://your-api-domain.com

---

# Troubleshooting

## Frontend does not start

Try:

rm -rf node_modules
npm install
npm run dev -- --webpack

For production:

npm run build
npm start

## Backend cannot connect to MongoDB

Check:

MONGODB_URI

Make sure:

* MongoDB is running or MongoDB Atlas is accessible
* Credentials are correct
* The server IP is allowed by MongoDB Atlas
* The database name is correct

## API requests fail

Check:

NEXT_PUBLIC_API_URL

Make sure it points to the correct backend URL.

Also verify the backend CORS configuration.

---

# Source Code Handover

This repository contains the source code for:

* Next.js frontend
* Express.js backend
* Configuration examples
* Project documentation

Sensitive credentials and production environment files are intentionally excluded.

The client should configure their own:

* Database
* Cloudinary account
* Courier accounts/API credentials
* Email account
* Analytics accounts
* Production environment variables

---

# License

This project is provided to the client as part of the agreed source-code handover.

The usage, modification, deployment, and ownership rights are subject to the terms agreed between the developer and client.
