# Translink - Advanced 3D Fleet Management Experience

A sophisticated web application featuring real-time 3D visualization of fleet telemetrics data, built with Three.js, WebGL, and modern web technologies.

## Features

- **3D Fleet Visualization**: Real-time particle system displaying vehicle telemetrics
- **Interactive AI Assistant**: Conversational interface for fleet management queries
- **Advanced Theme System**: Customizable UI and 3D scene themes
- **Performance Optimized**: Adaptive rendering based on device capabilities
- **Accessibility Compliant**: WCAG 2.1 AA compliant with keyboard navigation
- **Mobile Responsive**: Optimized experience across all devices

## Tech Stack

- **Frontend**: Vanilla JavaScript/TypeScript, Three.js, WebGL
- **Animation**: GSAP (GreenSock)
- **Scrolling**: Lenis smooth scroll
- **Build Tool**: Vite
- **Testing**: Vitest
- **Linting**: ESLint with TypeScript support

## Getting Started

### Prerequisites

- Node.js 18+ 
- Modern browser with WebGL 2.0 support

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run tests
npm run test

# Lint code
npm run lint
```

### Development

```bash
# Start with debug mode
npm run dev -- --debug

# Run tests in watch mode
npm run test:watch

# Type checking
npm run type-check
```

## Project Structure

```
src/
├── js/
│   ├── gl/                 # WebGL and Three.js components
│   │   ├── Shaders/       # Custom shaders
│   │   ├── World/         # 3D scenes and geometry
│   │   └── Utils/         # WebGL utilities
│   ├── modules/           # UI modules and components
│   ├── theme/             # Theme system
│   ├── utils/             # Utility functions
│   └── data/              # Data services
├── css/
│   └── components/        # Component-specific styles
└── test/                  # Test files
```

## Key Components

### Fleet Telemetrics System
Real-time vehicle data visualization with:
- Live position tracking
- Fuel level monitoring
- Engine diagnostics
- Driver behavior analysis

### Theme System
Comprehensive theming with:
- UI color customization
- 3D scene color management
- Preset themes (Default, Dark, Light, Neon)
- Import/export functionality

### Performance Optimization
- Object pooling for particles
- Frustum culling
- Adaptive quality based on FPS
- Lazy loading of assets

## Browser Support

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

WebGL 2.0 support required for full functionality.

## Performance

- Target: 60 FPS on desktop, 30 FPS on mobile
- Memory usage: <100MB typical
- Load time: <3s on fast connections

## Accessibility

- WCAG 2.1 AA compliant
- Keyboard navigation support
- Screen reader compatible
- Reduced motion support
- High contrast mode

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## License

Proprietary - OFF+BRAND

## Support

For technical support or questions, contact the development team.