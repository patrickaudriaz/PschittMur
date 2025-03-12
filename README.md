# 🧴💨🧱 Pschitt Mur

A Vue 3 web application for creating and managing bouldering problems on the spray wall (Pschitt Mur) located at Le Hangar climbing gym in Fribourg, Switzerland.

## Features

- Create new bouldering problems on a spray wall
- Select holds and assign them types (start, hand, feet, top)
- Set problem name, creator, and grade (French scale)
- View all created problems
- View detailed information about each problem
- Password protection for app access
- MongoDB database for persistent storage
- Mobile-first responsive design

## About Le Hangar

Le Hangar is a climbing gym located in Fribourg, Switzerland. The "Pschitt Mur" spray wall allows climbers to create their own boulder problems. This application helps climbers design, save, and share their creations with the community.

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- MongoDB Atlas account (or local MongoDB instance)

## Setup

1. Clone the repository:

```
git clone <repository-url>
cd pschitt-mur
```

2. Install dependencies:

```
npm install
# or
yarn install
```

3. Configure environment variables:
   - Copy `.env.example` to `.env`
   - Set your password in the `.env` file (default is "hangar")

```
cp .env.example .env
```

4. Add your spray wall image:
   Place your spray wall image named `spraywall.jpg` in the `public` directory.

5. Start the backend server:

```
cd server
npm install
npm start
```

6. In a new terminal, start the frontend development server:

```
npm run dev
# or
yarn dev
```

7. Open your browser and navigate to the URL shown in the terminal (usually http://localhost:5173)

## Usage

### Authentication

The app is protected by a password. Use the password defined in your `.env` file to access the application.

### Creating a Problem

1. Click on "Create New Problem" on the home page
2. Fill in the problem details (name, creator, grade)
3. Select holds on the spray wall by clicking on them
4. Choose the hold type (start, hand, feet, top) for each selected hold
5. Click "Save Problem" to save your problem

### Viewing Problems

- All problems are displayed on the home page
- Click on a problem card to view detailed information about that problem

### Deleting Problems

1. Navigate to the problem details page
2. Click the "Delete Problem" button
3. Confirm the deletion

## Project Structure

- `src/` - Frontend Vue application
  - `components/` - Vue components
  - `views/` - Vue views/pages
  - `stores/` - Pinia stores for state management
  - `router/` - Vue Router configuration
  - `services/` - API services
  - `assets/` - Static assets like styles and images
- `server/` - Backend Express application
  - `index.js` - Express server and MongoDB connection
  - `package.json` - Server dependencies

## Technologies Used

- **Frontend**:

  - Vue 3 with Composition API
  - Vite for fast development
  - Vue Router for routing
  - Pinia for state management
  - SCSS for styling
  - Axios for API requests
  - LocalStorage for fallback data persistence

- **Backend**:
  - Express.js for the API server
  - MongoDB for database storage
  - Mongoose for MongoDB object modeling

## Data Persistence

The application uses a multi-layered approach to data persistence:

1. **Primary Storage**: MongoDB database via the backend API
2. **Fallback Storage**: LocalStorage in the browser

If the MongoDB connection fails, the application will automatically fall back to using LocalStorage, ensuring that users can still use the app even when offline or if there are server issues.

## Customization

### Holds Positioning

The current implementation uses a grid of holds as an example. In a real application, you would want to map the holds to the actual positions on your spray wall image.

To customize the holds positions, modify the `initializeHolds` function in the `SprayWall.vue` component.

### Styling

The application uses SCSS for styling. You can customize the colors and other variables in the `src/assets/styles/main.scss` file.

## License

MIT
