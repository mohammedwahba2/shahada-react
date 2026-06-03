# Shahada Recitation Web App

Interactive web app for learning and reciting the Shahada with real-time voice recognition and audio visualization.

![Shahada App Preview](public/preview.png)

## Features

- **Voice Recognition** – Real-time Arabic speech-to-text using Web Speech API
- **Text Input Fallback** – Type the Shahada on browsers without speech support (iOS, Firefox)
- **Audio Visualization** – Dynamic orb animation that reacts to microphone input
- **Light/Dark Mode** – Full theme support with localStorage persistence
- **Responsive Design** – Works on mobile and desktop
- **Pronunciation Guide** – Audio playback for each Shahada step
- **Certificate** – Personalized certificate with print-to-PDF support

## Tech Stack

- React 18 + TypeScript
- Vite
- Tailwind CSS
- Web Speech API
- Web Audio API

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- A modern browser (Chrome, Edge, Safari, Firefox, or iOS Safari)
- Microphone access (required for voice recognition)

### Installation

```bash
# Clone the repository
git clone https://github.com/mohammedwahba2/shahada-react.git
cd shahada-react

# Install dependencies
npm install

# Start the development server
npm run dev
```

The app will be available at `http://localhost:5173`

### Building for Production

```bash
# Create a production build
npm run build

# Preview the production build locally
npm run preview
```

### Linting

```bash
# Check for lint errors
npm run lint

# Auto-fix fixable errors
npm run lint:fix
```

### Tests

```bash
# Run unit tests once
npm run test

# Watch mode while developing
npm run test:watch
```

## Project Structure

```
src/
├── components/         # React components
│   ├── Button.tsx
│   ├── Certificate.tsx
│   ├── Header.tsx
│   ├── IntroFlow.tsx
│   ├── MatchedWordsDisplay.tsx
│   ├── MobileMenu.tsx
│   ├── RecitePrompt.tsx
│   └── VisualizerOrb.tsx
├── config/            # Shared configuration
│   └── navLinks.ts
├── context/           # Context API
│   └── ThemeContext.tsx
├── data/              # Shahada data
│   └── shahada.ts
├── hooks/             # Custom hooks
│   ├── useAudioVisualizer.ts
│   ├── useSpeakingDetection.ts
│   └── useSpeechRecognition.ts
├── types/             # TypeScript types
│   └── index.ts
├── utils/             # Utility functions
│   └── shahadaText.ts
├── App.tsx            # Main component
├── main.tsx           # Entry point
└── index.css          # Global styles
```

## How It Works

### Voice Recognition

The `useSpeechRecognition` hook uses the Web Speech API with Arabic language support. When the user speaks, the API returns both interim and final transcripts. The app normalizes the text (removes diacritics, standardizes Arabic letter forms) and matches it against the 5 Shahada steps. Once all steps are matched, the certificate is shown.

### Text Input Fallback

On browsers without Web Speech API support (iOS Safari, Firefox), the app automatically switches to a text input mode. The user types the Shahada in Arabic and the same matching logic applies — no error messages, no broken experience.

### Audio Visualization

The `useAudioVisualizer` hook requests microphone access and creates an AudioContext with an AnalyserNode. Each frame reads audio data and calculates RMS (Root Mean Square) volume. The volume value (0-255) drives the orb animation.

### Theme System

`ThemeContext` manages light/dark mode globally. Theme preference is persisted to localStorage. Tailwind's `dark:` modifier applies dark mode styles.

## Assessment Requirements

| Requirement | Status |
|-------------|--------|
| React Functional Components | ✅ |
| React Hooks & Context API | ✅ |
| Responsive UI | ✅ |
| Light/Dark Mode | ✅ |
| Voice Recognition | ✅ |
| Audio Visualization | ✅ |
| Code Comments | ✅ |
| README Documentation | ✅ |

## Browser Support

| Browser | Voice Recognition | Text Fallback | Audio Visualization |
|---------|:-----------------:|:-------------:|:-------------------:|
| Chrome (Desktop) | ✅ | — | ✅ |
| Edge | ✅ | — | ✅ |
| Safari (Mac) | ✅ | — | ✅ |
| Chrome (Android) | ✅ | — | ✅ |
| Firefox | ❌ | ✅ | ✅ |
| Safari (iOS) | ❌ | ✅ | ✅ |

> Browsers without Web Speech API support automatically switch to text input mode.

## Privacy

- **Microphone Access**: Required for voice recognition and audio visualization
- **No Data Collection**: All processing happens locally in the browser
- **localStorage**: Only used to persist theme preference
- **No External APIs**: No data is sent to any external servers

## Deployment

### Live Demo

Check out the live demo: [https://shehada-react.vercel.app/](https://shehada-react.vercel.app/)

### Vercel

```bash
npm i -g vercel
vercel
```

## Shahada Steps

The Shahada is divided into 5 steps:

1. **أَشْهَدُ أَن لَّا إِلَٰهَ** (I bear witness there is no god)
2. **إلا الله** (except Allah)
3. **وَأَشْهَدُ** (And I bear witness)
4. **أَنَّ مُحَمَّدًا** (that Muhammad)
5. **رَّسُولُ ٱللَّٰهِ** (is the Messenger of Allah)

---

Built with React, TypeScript, and Tailwind CSS