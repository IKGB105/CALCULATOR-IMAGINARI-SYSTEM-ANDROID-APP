# Complex Calc - Android Calculator App

A mobile-optimized calculator for solving systems of linear equations with complex numbers and phasors. Built with React and Capacitor for Android.

![Version](https://img.shields.io/badge/version-1.05-blue)
![Platform](https://img.shields.io/badge/platform-Android-green)
![React](https://img.shields.io/badge/React-18.3.1-61DAFB)
![Capacitor](https://img.shields.io/badge/Capacitor-6.2.0-119EFF)

## ✨ Features

- **Complex Number Support**: Solve systems with complex numbers (3+4j, 2-5i)
- **Phasor Notation**: Input in polar form (10∠30°, 5∠-90°)
- **Custom Keyboard**: Mobile-optimized keyboard with symbols (j, i, ∠, °)
- **Multiple Themes**: Dark, Light, and Pink themes
- **Solution History**: Save and review previous solutions
- **Responsive Design**: Optimized for Android mobile screens
- **Matrix Sizes**: Support for 1×1 up to 10×10 matrices
- **Gaussian Elimination**: Accurate solver using pivoting

## 📱 Screenshots

(Add screenshots here)

## 🚀 Installation

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- Android Studio (for building APK)
- Java JDK 17+

### Setup

1. **Clone the repository**
```bash
git clone https://github.com/IKGB105/CALCULATOR-IMAGINARI-SYSTEM-ANDROID-APP.git
cd CALCULATOR-IMAGINARI-SYSTEM-ANDROID-APP
```

2. **Install dependencies**
```bash
npm install
```

3. **Build the web app**
```bash
npm run build
```

4. **Sync with Android**
```bash
npx cap sync android
```

5. **Open in Android Studio**
```bash
npx cap open android
```

6. **Build APK**
- In Android Studio: **Build → Build Bundle(s) / APK(s) → Build APK(s)**
- Or via terminal: `cd android && ./gradlew assembleDebug`

## 💻 Development

### Run in browser (development mode)
```bash
npm start
```

### Build for production
```bash
npm run build
npx cap sync android
```

### Run on Android device
```bash
npm run build
npx cap sync android
npx cap run android
```

## 📖 Usage

### Input Formats

**Complex Numbers:**
- Rectangular: `3+4j`, `2-5i`, `1.5+2.3j`
- Pure imaginary: `j`, `5i`, `-2j`
- Real numbers: `5`, `3.14`, `-7`

**Phasors (Polar Form):**
- `10∠30°` - magnitude 10, angle 30 degrees
- `5∠-90` - magnitude 5, angle -90 degrees
- `3.5∠0°` - magnitude 3.5, angle 0 degrees

### Example System (3×3)

Solve:
```
(2+1i)x₁ - x₂         = 1
  -x₁ + (2+0.5i)x₂ - x₃ = 0
       -x₂ + 2x₃     = 1i
```

**Input Matrix:**
```
2+1i  -1      0
-1    2+0.5i -1
0     -1      2
```

**Input Vector:**
```
1
0
1i
```

Click **Solve System** to get results in both polar and rectangular forms.

## 🎨 Themes

- **🌙 Dark Mode**: Dark background with blue accents
- **☀️ Light Mode**: Light background for bright environments
- **💖 Pink Mode**: Soft pink theme with custom color scheme

Cycle through themes by clicking the theme button in the header.

## 🛠️ Tech Stack

- **Frontend**: React 18.3.1
- **Mobile**: Capacitor 6.2.0
- **Build Tool**: Create React App
- **Language**: JavaScript (ES6+)
- **Storage**: Capacitor Preferences API

## 📂 Project Structure

```
complex-calc/
├── src/
│   ├── App.js          # Main application component
│   ├── App.css         # Styling
│   └── index.js        # Entry point
├── public/             # Static assets
├── android/            # Android native project
├── build/              # Production build
├── package.json        # Dependencies
└── capacitor.config.json  # Capacitor configuration
```

## 🧮 Algorithm

Uses **Gaussian Elimination with Partial Pivoting** for solving systems:
1. Forward elimination with row swapping
2. Back substitution
3. Handles complex number arithmetic
4. Detects singular matrices

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 👥 Authors

- **Iker Garcia** - Universidad Autónoma de Aguascalientes (UAA)
- Das Reyes
- Roberto Lopez
- Kevin Lara

## 📄 License

This project is licensed under the MIT License.

## 🐛 Known Issues

- Large matrices (>7×7) may require horizontal scrolling
- Keyboard may cover input on some devices (working as intended with custom keyboard)

## 🔮 Future Features

- [ ] Step-by-step solution display
- [ ] Matrix determinant calculator
- [ ] Matrix operations (inverse, transpose)
- [ ] Undo/Redo functionality
- [ ] More example systems
- [ ] Export results to PDF
- [ ] Swipe gestures for history

## 📞 Contact

For issues or questions, please open an issue on GitHub.

---

Made with ❤️ for complex number calculations
