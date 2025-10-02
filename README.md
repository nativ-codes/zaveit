# Zave It 📱

> Never lose a great post, link, or idea again.

Zave It is a mobile application that lets you save and organize content from any app with just one tap. Our AI automatically categorizes your saved posts, making it effortless to find what you need when you need it.

## 🎯 About

Found something worth keeping while browsing? Just share it to Zave It. Whether it's an article, video, social media post, or any other content, Zave It captures it instantly and uses AI to organize it into relevant categories like #music, #art, #history, or your own custom tags. No more lost bookmarks or endless scrolling to find that one post you saved weeks ago.

## 📲 Download

Get Zave It on your favorite platform:

<div>
  <a href="https://apps.apple.com/ro/app/zaveit-smart-bookmark-manager/id6747726703"><img src="https://nativ.codes/assets/images/projects/appstore.png" alt="drawing" width="130"/></a>
  <a href="https://play.google.com/store/apps/details?id=com.nativcodes.zaveit&hl=en"><img src="https://nativ.codes/assets/images/projects/googleplay.png" alt="drawing" width="130"/></a>
</div>

## ✨ Key Features

### Flexible Authentication
- **Google OAuth** - Sign in with your Google account
- **Apple OAuth** - Sign in with your Apple ID
- **Anonymous Mode** - Use the app without creating an account

### Smart Content Management
- **Share from Any App** - Found something worth keeping? Just share it to Zave It
- **AI-Powered Categorization** - Our AI instantly sorts your saved posts into relevant categories
- **Custom Tags** - Create and organize content with your own custom tags
- **Lightning-Fast Search** - Quickly find your saved content by category, keyword, or tag
- **Easy Content Actions** - Open saved posts, copy links, or share them again anytime

### User Experience
- **Clean, Minimalist Interface** - Distraction-free browsing
- **Automatic Sorting** - AI does the heavy lifting for you
- **Cross-App Integration** - Works seamlessly with any app that supports sharing

## 🏗️ Architecture & Tech Stack

### Frontend
- **React Native** - Cross-platform mobile development
- **Expo** (v53) - Development framework and build tooling
- **Expo Router** - File-based routing
- **TypeScript** - Type-safe code with strict mode

### State Management & Storage
- **Zustand** - Global state management
- **React Native MMKV** - High-performance local storage
- **React Context** - Authentication state management

### Backend & Services
- **Firebase**
  - Firebase Authentication - User authentication
  - Firebase Firestore - Real-time database
- **Google Sign-In** - OAuth integration
- **Apple Authentication** - OAuth integration

### UI/UX Libraries
- **React Native Reanimated** - Smooth animations
- **React Native Gesture Handler** - Touch gestures
- **Shopify Flash List** - High-performance lists

### Developer Experience
- **TypeScript** - Full type safety
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Reactotron** - Debugging and development tools
- **Fastlane** - Automated deployment

### Key Integrations
- **expo-share-intent** - Share extension for receiving content from other apps
- **Mixpanel** - Analytics tracking
- **Expo Haptics** - Tactile feedback
- **Expo Clipboard** - Copy/paste functionality

## 🗺️ Roadmap

### Upcoming Features

#### Shareable Links & Web Viewer
Users will be able to generate unique URLs tied to their accounts to:
- **Share Collections** - Create public links to share curated collections of saved posts
- **Web Browser Access** - View and manage saved posts from any web browser
- **Selective Sharing** - Choose which posts or tags to make public
- **Custom URLs** - Personalized URLs for your public collections

This feature will bridge the mobile-first experience with web accessibility, making it easy to share your curated content with others or access your saves from any device.

## 📁 Project Structure

```
zaveit/
├── app/                    # Expo Router pages and navigation
├── assets/                 # Images, fonts, and static resources
├── common/                 # Shared components, constants, and utilities
│   ├── components/         # Reusable UI components
│   ├── constants/          # App-wide constants (colors, units, configs)
│   ├── containers/         # Container components
│   ├── layouts/            # Layout components
│   └── utils/              # Helper functions and hooks
├── config/                 # Configuration files
│   ├── analytics/          # Analytics setup (Mixpanel)
│   ├── contexts/           # React contexts
│   └── storage/            # Storage hooks and utilities
├── screens/                # Screen components
├── services/               # API services and business logic
├── types/                  # TypeScript type definitions
└── ios/android/            # Native project files
```

## 🧪 Development

This project follows best practices for React Native and Expo development:

- **File-based routing** using Expo Router
- **TypeScript strict mode** for enhanced type safety
- **Functional components** with hooks
- **Zustand** for state management with selector pattern
- **Modular component structure** with separate files for types and styles
- **Custom design system** using centralized colors and units

## 📝 Code Style

- Use functional and declarative programming patterns
- Prefer TypeScript types over interfaces
- Use PascalCase for types and enums, suffix with `Type` or `Enum`
- Use descriptive variable names with auxiliary verbs (e.g., `isLoading`, `hasError`)
- Follow the component structure: component file, types file, styles file
- Always use centralized Colors and Units constants

## 📄 License

This project is private and proprietary.

## 📧 Contact

For questions or support, please open an issue in the repository.

---

Built with ❤️ by NativCodes
