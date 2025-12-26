# Penny Rounding Calculator - Expo App

A mobile application for calculating Swedish penny rounding for cash transactions after tax.

## Overview

This is an Expo (React Native) app that helps sellers and customers calculate optimal pre-tax prices that result in nickel-rounded totals after applying sales tax.

## Features

- Calculate Swedish penny rounding for cash transactions
- Real-time suggestions for both sellers and customers
- Automatic dark mode support
- Clean, responsive mobile interface
- Works on iOS, Android, and Web

## Getting Started

### Prerequisites

- Node.js 18 or later
- npm or yarn

### Installation

1. Install dependencies:

```bash
npm install
```

2. Start the development server:

```bash
npm start
```

This will start the Expo development server. You can then:

- Press `a` to open on Android emulator
- Press `i` to open on iOS simulator
- Scan the QR code with Expo Go app on your physical device

### Available Scripts

- `npm start` - Start the Expo development server
- `npm run android` - Start the app on Android
- `npm run ios` - Start the app on iOS
- `npm run web` - Start the app in a web browser
- `npm run build` - Export the app for production

## Building for Production

### Android

```bash
eas build --platform android
```

### iOS

```bash
eas build --platform ios
```

Note: You'll need to set up EAS (Expo Application Services) for production builds.

## Project Structure

```
├── app/                    # Expo Router pages
│   ├── _layout.tsx        # Root layout
│   └── index.tsx          # Home screen
├── components/            # React Native components
│   ├── price-rounding-calculator.tsx
│   └── ui/               # UI components
├── assets/               # Images and other assets
└── app.json             # Expo configuration
```

## How It Works

The app implements Swedish penny rounding rules:

- **Round Down**: Totals ending in 1, 2, 6, 7
- **Round Up**: Totals ending in 3, 4, 8, 9
- **No Rounding**: Totals ending in 0, 5

The calculator suggests optimal pre-tax prices for both sellers (maximize revenue) and customers (minimize cost) that result in nickel-rounded totals.

## Technology Stack

- Expo
- React Native
- TypeScript
- Expo Router
- React Native SVG

## License

Private
