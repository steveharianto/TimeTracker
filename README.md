# Time Tracker

A minimalistic time tracking web application that allows you to track your daily activities with precision. The application displays a timeline view of your day, enables you to start and stop activities, and review your time usage throughout the day.

## Features

- **Timeline View**: Visual representation of your day's activities
- **Activity Tracking**: Start and stop actions with accurate timing
- **Data Storage**: All data saved to localStorage in your browser
- **Export Options**: Export your data as JSON or CSV
- **Clean Interface**: Simple, responsive design using Tailwind CSS

## Installation

No installation required! This is a client-side only application built with HTML, CSS, and JavaScript.

### Option 1: Use directly in browser

1. Clone this repository or download the files
2. Open `index.html` in your web browser

### Option 2: Use a local development server

If you want to serve the files using a local server:

1. Clone this repository
```
git clone https://github.com/yourusername/TimeTracker.git
cd TimeTracker
```

2. If you have Python installed:
```
# Python 3
python -m http.server

# Python 2
python -m SimpleHTTPServer
```

3. Or using Node.js:
```
# Install serve if you don't have it
npm install -g serve

# Run the server
serve .
```

4. Open your browser and go to `http://localhost:8000` (or whatever port is shown in the console)

## Usage

1. **Start an Activity**: Click the "Start Action" button to begin tracking an activity
2. **Name Your Activity**: Enter a title for what you're doing
3. **Stop the Activity**: Click "Stop Action" when you're done
4. **View Timeline**: See your activities visualized on the timeline
5. **Edit Activities**: Change activity names by clicking "Edit" in the activities list
6. **Export Data**: Click "Export Data" to save your tracking data as JSON or CSV

## Data Storage

All data is stored in your browser's localStorage. This means:

- Your data persists between sessions
- Your data is private and stays on your device
- Clearing browser data will erase your time tracking history

To back up your data, use the Export function regularly.

## Browser Compatibility

This application works best in modern browsers that support:
- ES6+ JavaScript
- localStorage API
- Flexbox and CSS Grid
- Modern CSS features

## License

MIT License

## Acknowledgments

- Built with [Tailwind CSS](https://tailwindcss.com/)
- Icons from [Heroicons](https://heroicons.com/) 