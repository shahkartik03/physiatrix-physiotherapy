# Medical Practice PWA

This is a Progressive Web App (PWA) designed for a medical practice, focusing on mobile-first responsiveness and implementing specific scheduling and onboarding workflows.

## Features

- **Appointment Scheduling**: Users can schedule appointments with available time slots.
- **Onboarding Flow**: New doctors can go through a guided onboarding process.
- **Responsive Design**: The application is optimized for mobile devices.

## Project Structure

```
medical-practice-pwa
├── public
│   ├── manifest.json
│   └── robots.txt
├── src
│   ├── main.tsx
│   ├── App.tsx
│   ├── vite-env.d.ts
│   ├── components
│   │   ├── scheduling
│   │   │   ├── AppointmentScheduler.tsx
│   │   │   └── ScheduleCalendar.tsx
│   │   ├── onboarding
│   │   │   ├── OnboardingFlow.tsx
│   │   │   └── OnboardingStep.tsx
│   │   ├── common
│   │   │   ├── Header.tsx
│   │   │   ├── Footer.tsx
│   │   │   └── Navigation.tsx
│   │   └── layout
│   │       └── MobileLayout.tsx
│   ├── pages
│   │   ├── Home.tsx
│   │   ├── Schedule.tsx
│   │   ├── Onboarding.tsx
│   │   └── Dashboard.tsx
│   ├── mocks
│   │   ├── handlers.ts
│   │   ├── appointments.ts
│   │   ├── patients.ts
│   │   └── providers.ts
│   ├── services
│   │   ├── api.ts
│   │   └── pwa.ts
│   ├── hooks
│   │   └── useScheduling.ts
│   ├── types
│   │   └── index.ts
│   ├── styles
│   │   └── index.css
│   └── utils
│       └── helpers.ts
├── package.json
├── vite.config.ts
├── tsconfig.json
├── index.html
└── README.md
```

## Getting Started

1. **Clone the repository**:
   ```
   git clone <repository-url>
   cd medical-practice-pwa
   ```

2. **Install dependencies**:
   ```
   npm install
   ```

3. **Run the application**:
   ```
   npm run dev
   ```

4. **Build for production**:
   ```
   npm run build
   ```

## Technologies Used

- React
- Vite
- TypeScript
- Tailwind CSS (for styling)

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any enhancements or bug fixes.

## License

This project is licensed under the MIT License. See the LICENSE file for details.