# 🧴💨🧱 Pschitt Mur

A Vue 3 web application for creating and managing bouldering problems on the spray wall (Pschitt Mur) located at Le Hangar climbing gym in Fribourg, Switzerland.

## Features

- Create new bouldering problems on a spray wall
- Select holds and assign them types (start, hand, feet, top)
- Set problem name, creator, and grade (French scale)
- View all created problems
- View detailed information about each problem
- Password protection for app access
- MongoDB for data persistence
- Mobile-first responsive design
- Serverless architecture using Netlify Functions

## About Le Hangar

Le Hangar is a climbing gym located in Fribourg, Switzerland. The "Pschitt Mur" spray wall allows climbers to create their own boulder problems. This application helps climbers design, save, and share their creations with the community.

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- MongoDB Atlas account (for database)

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
   - Set your password in the `.env` file
   - Add your MongoDB connection string

```
cp .env.example .env
```

4. Add your spray wall image:
   Place your spray wall image named `spraywall.jpg` in the `public` directory.

5. Start the development server with Netlify Functions:

```
npm run dev:all
# or
yarn dev:all
```

6. Open your browser and navigate to the URL shown in the terminal (usually http://localhost:5173)

## Deployment

This application is designed to be deployed as a serverless application to Netlify.

### Deploying to Netlify

1. Create a Netlify account if you don't have one
2. Connect your GitHub repository to Netlify
3. Configure the build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
4. Add the environment variables:
   - `VITE_APP_PASSWORD` with your desired password
   - `MONGODB_URI` with your MongoDB connection string
5. Deploy!

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
- `netlify/functions/` - Serverless functions for MongoDB operations
- `public/` - Public assets

## Technologies Used

- Vue 3 with Composition API
- Vite for fast development
- Vue Router for routing
- Pinia for state management
- SCSS for styling
- MongoDB Atlas for data storage
- Netlify Functions for serverless backend
- Axios for API requests

## Data Persistence

The application uses MongoDB Atlas for data persistence. This means:

1. Data is stored in a cloud database
2. Data is shared between all users
3. Data persists across different devices and browsers

The application also includes a localStorage fallback in case the MongoDB connection fails.

## Customization

### Holds Positioning

The current implementation uses a grid of holds as an example. In a real application, you would want to map the holds to the actual positions on your spray wall image.

To customize the holds positions, modify the `initializeHolds` function in the `SprayWall.vue` component.

### Styling

The application uses SCSS for styling. You can customize the colors and other variables in the `src/assets/styles/main.scss` file.

## License

MIT
