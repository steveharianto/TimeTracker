/**
 * Time Tracker Module
 * Handles the core functionality for tracking time
 */

const TimeTracker = (function() {
    // DOM Elements
    let actionButton;
    let activityTitleInput;
    let activityInputContainer;
    let elapsedTimeContainer;
    let elapsedTimeDisplay;
    let trackerStatus;
    
    // Tracking state
    let isTracking = false;
    let currentActivity = null;
    let elapsedTimeInterval = null;
    
    // Activity colors for variety
    const activityColors = [
        '#3B82F6', // primary
        '#8B5CF6', // purple
        '#EC4899', // pink
        '#F59E0B', // amber
        '#10B981', // green
        '#06B6D4', // cyan
        '#6366F1'  // indigo
    ];
    
    /**
     * Initialize the time tracker functionality
     */
    function init() {
        // Get DOM elements
        actionButton = document.getElementById('action-button');
        activityTitleInput = document.getElementById('activity-title');
        activityInputContainer = document.getElementById('activity-input-container');
        elapsedTimeContainer = document.getElementById('elapsed-time-container');
        elapsedTimeDisplay = document.getElementById('elapsed-time');
        trackerStatus = document.getElementById('tracker-status');
        
        // Set up event listeners
        actionButton.addEventListener('click', toggleTracking);
        activityTitleInput.addEventListener('input', updateActivityTitle);
        
        // Check if there's a current activity in storage
        restoreCurrentActivity();
    }
    
    /**
     * Restore current activity from storage if exists
     */
    function restoreCurrentActivity() {
        currentActivity = Storage.getCurrentActivity();
        
        if (currentActivity) {
            isTracking = true;
            
            // Update UI
            actionButton.textContent = 'Stop Action';
            actionButton.classList.remove('bg-primary');
            actionButton.classList.add('bg-danger');
            
            activityInputContainer.classList.remove('hidden');
            activityTitleInput.value = currentActivity.title;
            
            elapsedTimeContainer.classList.remove('hidden');
            
            // Start timer from the saved start time
            updateElapsedTime();
            elapsedTimeInterval = setInterval(updateElapsedTime, 1000);
            
            trackerStatus.textContent = 'Currently tracking: ' + currentActivity.title;
        }
    }
    
    /**
     * Toggle between starting and stopping time tracking
     */
    function toggleTracking() {
        if (isTracking) {
            stopTracking();
        } else {
            startTracking();
        }
    }
    
    /**
     * Start tracking a new activity
     */
    function startTracking() {
        isTracking = true;
        
        // Create new activity
        currentActivity = {
            id: generateUniqueId(),
            title: 'Unnamed Activity',
            startTime: Date.now(),
            endTime: null,
            duration: 0,
            color: getRandomColor()
        };
        
        // Save to storage
        Storage.saveCurrentActivity(currentActivity);
        
        // Update UI
        actionButton.textContent = 'Stop Action';
        actionButton.classList.remove('bg-primary');
        actionButton.classList.add('bg-danger');
        
        activityInputContainer.classList.remove('hidden');
        activityTitleInput.value = currentActivity.title;
        activityTitleInput.focus();
        
        elapsedTimeContainer.classList.remove('hidden');
        elapsedTimeDisplay.textContent = '00:00:00';
        
        // Start elapsed time counter
        elapsedTimeInterval = setInterval(updateElapsedTime, 1000);
        
        trackerStatus.textContent = 'Currently tracking: ' + currentActivity.title;
    }
    
    /**
     * Stop tracking the current activity
     */
    function stopTracking() {
        if (!currentActivity) return;
        
        isTracking = false;
        
        // Update activity data
        currentActivity.endTime = Date.now();
        currentActivity.duration = currentActivity.endTime - currentActivity.startTime;
        
        // Save completed activity
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        Storage.saveActivity(today, currentActivity);
        
        // Clear current activity
        Storage.saveCurrentActivity(null);
        currentActivity = null;
        
        // Update UI
        actionButton.textContent = 'Start Action';
        actionButton.classList.remove('bg-danger');
        actionButton.classList.add('bg-primary');
        
        activityInputContainer.classList.add('hidden');
        elapsedTimeContainer.classList.add('hidden');
        
        // Stop elapsed time counter
        clearInterval(elapsedTimeInterval);
        
        trackerStatus.textContent = 'No active tracking';
        
        // Refresh timeline and activity list
        if (typeof Timeline !== 'undefined') {
            Timeline.refresh();
        }
    }
    
    /**
     * Update the title of the current activity
     */
    function updateActivityTitle() {
        if (currentActivity && activityTitleInput.value.trim()) {
            currentActivity.title = activityTitleInput.value;
            Storage.saveCurrentActivity(currentActivity);
            trackerStatus.textContent = 'Currently tracking: ' + currentActivity.title;
        }
    }
    
    /**
     * Update elapsed time display
     */
    function updateElapsedTime() {
        if (!currentActivity) return;
        
        const elapsedMs = Date.now() - currentActivity.startTime;
        elapsedTimeDisplay.textContent = formatDuration(elapsedMs);
        
        // Add blinking effect every second
        elapsedTimeDisplay.classList.add('blink');
        setTimeout(() => {
            elapsedTimeDisplay.classList.remove('blink');
        }, 500);
    }
    
    /**
     * Format milliseconds into HH:MM:SS
     * @param {number} ms - Duration in milliseconds
     * @returns {string} Formatted duration
     */
    function formatDuration(ms) {
        const totalSeconds = Math.floor(ms / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        
        return [
            hours.toString().padStart(2, '0'),
            minutes.toString().padStart(2, '0'),
            seconds.toString().padStart(2, '0')
        ].join(':');
    }
    
    /**
     * Get a random color from the activity colors array
     * @returns {string} Color hex code
     */
    function getRandomColor() {
        return activityColors[Math.floor(Math.random() * activityColors.length)];
    }
    
    /**
     * Generate a unique ID for activities
     * @returns {string} Unique ID
     */
    function generateUniqueId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    }
    
    // Public API
    return {
        init,
        formatDuration,
        getCurrentActivity: () => currentActivity,
        isTracking: () => isTracking
    };
})(); 