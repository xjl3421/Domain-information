# 🗡️ Sword Soul Domain Query - Free One-Stop Domain Information Query Tool

<div align="center">

[![中文](https://img.shields.io/badge/语言-中文-red.svg)](README.md)
[![English](https://img.shields.io/badge/Language-English-blue.svg)](README.en.md)

**Sword Soul Domain Query** is a powerful online domain information query tool that supports both RDAP and WHOIS query methods, providing users with free, fast, and accurate domain registration information query services.

[![Live Demo](https://img.shields.io/badge/Demo-Live-green.svg)](http://localhost:3000)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Maintenance](https://img.shields.io/badge/Maintenance-Active-brightgreen.svg)](https://jhkj.netlify.app)

</div>

## ✨ Main Features

### 🔍 Multiple Query Methods
- **RDAP Query** - Modern domain query protocol based on Registration Data Access Protocol
- **WHOIS Query** - Traditional domain information query method
- **Smart Switching** - Automatically identifies domain suffixes, switches to WHOIS when RDAP is not supported

### 📊 Supported Query Objects
- **Domain Query** - Get domain registration status, registrar, expiration time and other information
- **IP Address Query** - Query IP address geolocation and related information
- **Autonomous System Number (ASN) Query** - Get network operator information
- **Entity Handle Query** - Query registration authority entity information

### 💰 Price Query Feature
- **Real-time Prices** - Query domain registration, renewal, and transfer prices
- **Multi-platform Comparison** - Display price information from multiple registrars
- **Smart Sorting** - Sort by price from low to high, recommend the best options

### 🎨 User Experience
- **Responsive Design** - Perfectly adapted for desktop and mobile
- **Dark Mode** - Support for light/dark theme switching
- **Real-time Feedback** - Query results displayed instantly, clear loading status
- **Error Handling** - Friendly error prompts and automatic retry mechanism

## 🚀 Technology Stack

### 🎯 Core Framework
- **⚡ Next.js 15** - React framework based on App Router
- **📘 TypeScript 5** - Type-safe JavaScript development experience
- **🎨 Tailwind CSS 4** - Utility-first CSS framework

### 🧩 UI Components & Styling
- **🧩 shadcn/ui** - High-quality accessible components based on Radix UI
- **🎯 Lucide React** - Beautiful and consistent icon library
- **🌈 Next Themes** - Perfect dark mode support

### 🔄 State Management & Data Fetching
- **🐻 Zustand** - Simple and scalable state management
- **🔄 TanStack Query** - Powerful React data synchronization
- **🌐 Axios** - Promise-based HTTP client

### 🔐 Authentication & Security
- **🔐 NextAuth.js** - Complete open-source authentication solution
- **📊 Rate Limiting** - Intelligent request frequency control
- **🛡️ Admin Authentication** - Support for admin and personal use modes

## 🎯 Why Choose Sword Soul Domain Query?

- **🏎️ Fast Query** - Optimized query logic, millisecond-level response
- **🎨 Beautiful Interface** - Modern UI design, simple and intuitive operation
- **🔒 Type Safety** - Complete TypeScript type definitions
- **📱 Responsive Design** - Mobile-first design philosophy
- **🔄 Smart Switching** - Automatically select the best query method
- **💰 Price Transparency** - Real-time price queries to help users make the best choices
- **🌐 Multi-protocol Support** - Simultaneous support for RDAP and WHOIS protocols
- **🚀 Production Ready** - Optimized build and deployment configuration

## 🚀 Quick Start

### Environment Requirements
- Node.js 18.0 or higher
- npm or yarn package manager

### Installation Steps

```bash
# Clone the project
git clone https://github.com/xjl3421/domain-information.git

# Enter the project directory
cd domain-information

# Install dependencies
npm install

# Start the development server
npm run dev
```

### Access the Application

Open [http://localhost:3000](http://localhost:3000) to see the application running.

### Available Scripts

```bash
# Development mode
npm run dev

# Build production version
npm run build

# Start production server
npm start

# Code linting
npm run lint

# Database operations
npm run db:push
```

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # Reusable React components
│   ├── ui/               # shadcn/ui components
│   └── theme-provider.tsx # Theme provider
├── hooks/                 # Custom React hooks
├── lib/                   # Utility functions and configurations
│   ├── db.ts             # Database client
│   └── socket.ts         # WebSocket configuration
└── prisma/                # Database schema
    └── schema.prisma      # Prisma data model
```

## 🎨 Available Features & Components

### 🔍 Query Features
- **Multi-protocol Support** - Dual protocol query with RDAP and WHOIS
- **Smart Switching** - Automatically select query method based on domain suffix
- **Batch Query** - Support for multiple domain queries simultaneously
- **History Records** - Query history saving and management

### 💰 Price Query
- **Real-time Prices** - Get latest domain registration prices
- **Multi-platform Comparison** - Display prices from different registrars
- **Price Trends** - Price change history and trend analysis
- **Discount Alerts** - Automatic alerts when prices drop

### 🎨 User Interface
- **Theme Switching** - Seamless light/dark mode switching
- **Responsive Layout** - Perfect adaptation to various screen sizes
- **Loading Status** - Elegant loading animations and progress indicators
- **Error Handling** - Friendly error prompts and retry mechanisms

### 🔐 Authentication & Permissions
- **Admin Mode** - Complete administrator permission control
- **Personal Mode** - Unlimited personal use queries
- **Rate Limiting** - Intelligent request frequency control
- **Secure Authentication** - Password-based secure authentication mechanism

## 🔧 Configuration Guide

### Environment Variables

Create a `.env.local` file and configure the following variables:

```env
# Admin password
ADMIN_PASSWORD=your_secure_password

# Database configuration
DATABASE_URL="file:./dev.db"

# NextAuth configuration
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000
```

### Database Setup

The project uses Prisma ORM and SQLite database:

```bash
# Push database schema
npm run db:push

# View database
npm run db:studio
```

## 🌐 Deployment Guide

### Vercel Deployment

1. Push the project to GitHub
2. Import the project in Vercel
3. Configure environment variables
4. Deploy and enjoy automatic updates

### Docker Deployment

```bash
# Build image
docker build -t domain-query .

# Run container
docker run -p 3000:3000 domain-query
```

### Traditional Server Deployment

```bash
# Build project
npm run build

# Start service
npm start
```

## 🤝 Contribution Guide

We welcome all forms of contributions!

### Development Process

1. Fork this project
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Create a Pull Request

### Code Standards

- Use TypeScript for type-safe development
- Follow ESLint and Prettier code standards
- Write clear component and function documentation
- Ensure all features have appropriate test coverage

## 📄 Open Source License

This project is open source under the [MIT License](LICENSE).

## 🙏 Acknowledgments

Thanks to the following open source projects and communities for their support:

- [Next.js](https://nextjs.org/) - React framework
- [shadcn/ui](https://ui.shadcn.com/) - UI component library
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework
- [Prisma](https://prisma.io/) - Database ORM
- [NextAuth.js](https://next-auth.js.org/) - Authentication solution

## 📞 Contact Us

- **Project Maintenance**: [Sword Soul Technology](https://jhkj.netlify.app)
- **Open Source Repository**: [GitHub](https://github.com/xjl3421/domain-information)
- **Issue Feedback**: [GitHub Issues](https://github.com/xjl3421/domain-information/issues)

---

<div align="center">

**Sword Soul Domain Query** - Making domain queries simple and efficient

Maintained with ❤️ by [Sword Soul Technology](https://jhkj.netlify.app)

</div>