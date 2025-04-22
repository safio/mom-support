# Mom Support App

A comprehensive mobile application designed to support mothers through their parenting journey. This app provides tools for tracking activities, managing self-care, accessing guidance, and monitoring progress.

## Features

- **Authentication System**: Secure login, signup, password reset, and email verification
- **Activity Tracking**: Log and monitor daily activities and situations
- **Progress Monitoring**: Track achievements and view progress over time
- **Self-Care Tools**: Resources and reminders for maternal well-being
- **Guidance Content**: Tips and information for various parenting scenarios
- **Streak Tracking**: Maintain motivation through streak counters
- **Subscription Options**: Access to premium features and content

## Technology Stack

- **Frontend**: React Native with Expo
- **Navigation**: Expo Router for file-based routing
- **Database**: Supabase for backend storage
- **Authentication**: Custom authentication system with Supabase
- **State Management**: React Context API
- **UI Components**: Custom components with responsive design

## Getting Started

### Prerequisites

- Node.js (v14+)
- npm or yarn package manager
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (Mac only) or Android Emulator (optional)
- Supabase account for database functionality

### Running Locally

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/safio/mom-support.git
    cd mom-support
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    # or
    yarn install
    ```

3.  **Environment Setup:**
    Create a `.env` file in the root directory with the following variables:
    ```
    EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
    EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
    ```

4.  **Run the app:**
    ```bash
    npx expo start
    ```
    This will open Expo Dev Tools in your browser. You can then run the app on:
    *   An Android emulator/device (press `a`)
    *   An iOS simulator/device (press `i`)
    *   Web browser (press `w`)

## Project Structure

*   `app/`: Contains the screens and navigation logic using Expo Router
    * `(auth)/`: Authentication-related screens
    * `(subscription)/`: Subscription management screens
    * `(tabs)/`: Main app tab screens including home, guidance, progress, etc.
*   `assets/`: Static assets like images and fonts
*   `components/`: Reusable UI components
    * `ActivityModal.jsx`: Modal for activity creation/editing
    * `Button.jsx`: Custom button component
    * `Card.jsx`: Card component for displaying information
    * `StreakDisplay.jsx`: Component for displaying user streaks
*   `constants/`: Global constants like colors or configuration
*   `contexts/`: React Context API providers
    * `AuthContext.js`: Authentication state management
    * `DatabaseContext.jsx`: Database interaction management
*   `database/`: SQL scripts and database related files
*   `lib/`: Utility functions and helper libraries
    * `supabase.js`: Supabase client configuration
    * `database.js`: Database utility functions
    * `uuid-helper.js`: UUID generation utilities

## Database

The application uses Supabase as its database solution. The database schema includes tables for:

* Users and authentication
* Activities and completion tracking
* Streaks and progress information
* User preferences and settings

Database scripts can be found in the `database/` directory.

## Deployment

The app can be built for production using Expo's build service:

```bash
expo build:android  # For Android builds
expo build:ios      # For iOS builds
```

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

Please ensure that appropriate tests are updated as needed.

## License

[MIT](https://choosealicense.com/licenses/mit/)
