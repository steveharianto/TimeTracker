/**
 * Timeline Module
 * Handles the visualization of activities on a timeline
 */

const Timeline = (function() {
    // DOM Elements
    let timelineContainer;
    let timelineElement;
    
    // Timeline config
    const timelineConfig = {
        startHour: 0,      // 00:00
        endHour: 24,       // 24:00
        hourHeight: 60,    // px per hour
        timeMarkerStep: 1, // Show a marker every 1 hour
    };
    
    // Current position of time indicator
    let currentTimeIndicator = null;
    let timeIndicatorInterval = null;
    
    /**
     * Initialize the timeline visualization
     */
    function init() {
        // Get DOM elements
        timelineContainer = document.getElementById('timeline-container');
        timelineElement = document.getElementById('timeline');
        
        // Create timeline markers
        createTimeMarkers();
        
        // Add current time indicator
        addCurrentTimeIndicator();
        
        // Load and render activities
        renderActivities();
        
        // Update current time indicator periodically
        timeIndicatorInterval = setInterval(updateCurrentTimeIndicator, 60000); // Every minute
    }
    
    /**
     * Create hour markers on the timeline
     */
    function createTimeMarkers() {
        timelineElement.innerHTML = ''; // Clear existing markers
        
        // Set timeline height based on config
        const totalHours = timelineConfig.endHour - timelineConfig.startHour;
        timelineElement.style.height = (totalHours * timelineConfig.hourHeight) + 'px';
        
        // Create hour markers
        for (let hour = timelineConfig.startHour; hour <= timelineConfig.endHour; hour += timelineConfig.timeMarkerStep) {
            if (hour === timelineConfig.endHour) continue; // Skip the last hour (24:00)
            
            const markerPosition = calculatePositionForHour(hour);
            
            // Create marker element
            const marker = document.createElement('div');
            marker.className = 'timeline-marker';
            marker.style.top = markerPosition + 'px';
            
            // Create label for marker
            const label = document.createElement('div');
            label.className = 'timeline-label';
            label.textContent = formatHour(hour);
            
            // Add to timeline
            timelineElement.appendChild(marker);
            timelineElement.appendChild(label);
            label.style.top = markerPosition + 'px';
        }
    }
    
    /**
     * Add the current time indicator to the timeline
     */
    function addCurrentTimeIndicator() {
        // Create indicator element
        currentTimeIndicator = document.createElement('div');
        currentTimeIndicator.className = 'current-time-indicator';
        
        // Add to timeline
        timelineElement.appendChild(currentTimeIndicator);
        
        // Set initial position
        updateCurrentTimeIndicator();
    }
    
    /**
     * Update the position of the current time indicator
     */
    function updateCurrentTimeIndicator() {
        if (!currentTimeIndicator) return;
        
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        
        // Calculate position (hours + fraction of hour)
        const position = calculatePositionForTime(currentHour, currentMinute);
        currentTimeIndicator.style.top = position + 'px';
    }
    
    /**
     * Render activities on the timeline
     */
    function renderActivities() {
        // Get today's date in YYYY-MM-DD format
        const today = new Date().toISOString().split('T')[0];
        
        // Get activities for today
        const activities = Storage.getActivitiesByDate(today);
        
        // Remove existing activity blocks
        const existingBlocks = timelineElement.querySelectorAll('.activity-block');
        existingBlocks.forEach(block => block.remove());
        
        // Render each activity
        activities.forEach(activity => {
            renderActivityBlock(activity);
        });
    }
    
    /**
     * Render a single activity block on the timeline
     * @param {Object} activity - The activity to render
     */
    function renderActivityBlock(activity) {
        // Skip if missing start or end time
        if (!activity.startTime || !activity.endTime) return;
        
        // Create start and end date objects
        const startDate = new Date(activity.startTime);
        const endDate = new Date(activity.endTime);
        
        // Calculate positions
        const startPosition = calculatePositionForTime(
            startDate.getHours(), 
            startDate.getMinutes()
        );
        
        const endPosition = calculatePositionForTime(
            endDate.getHours(), 
            endDate.getMinutes()
        );
        
        // Create activity block element
        const block = document.createElement('div');
        block.className = 'activity-block';
        block.dataset.id = activity.id;
        block.style.top = startPosition + 'px';
        block.style.height = (endPosition - startPosition) + 'px';
        block.style.backgroundColor = activity.color;
        
        // Add activity title
        block.innerHTML = `
            <div class="font-medium text-white truncate">${activity.title}</div>
            <div class="text-white text-xs opacity-80">
                ${formatTime(startDate)} - ${formatTime(endDate)}
            </div>
            <div class="tooltip">
                ${activity.title}<br>
                ${formatTime(startDate)} - ${formatTime(endDate)}<br>
                Duration: ${TimeTracker.formatDuration(activity.duration)}
            </div>
        `;
        
        // Add to timeline
        timelineElement.appendChild(block);
    }
    
    /**
     * Calculate the vertical position for a given hour
     * @param {number} hour - Hour (0-24)
     * @returns {number} Position in pixels
     */
    function calculatePositionForHour(hour) {
        const hourOffset = hour - timelineConfig.startHour;
        return hourOffset * timelineConfig.hourHeight;
    }
    
    /**
     * Calculate the vertical position for a specific time
     * @param {number} hours - Hours (0-23)
     * @param {number} minutes - Minutes (0-59)
     * @returns {number} Position in pixels
     */
    function calculatePositionForTime(hours, minutes) {
        const hourPosition = calculatePositionForHour(hours);
        const minuteFraction = minutes / 60;
        return hourPosition + (minuteFraction * timelineConfig.hourHeight);
    }
    
    /**
     * Format hour for display
     * @param {number} hour - Hour (0-24)
     * @returns {string} Formatted hour
     */
    function formatHour(hour) {
        // Get hour format from settings (12 or 24)
        const settings = Storage.getSettings();
        const hourFormat = settings.hourFormat || 24;
        
        if (hourFormat === 12) {
            const period = hour >= 12 ? 'PM' : 'AM';
            const displayHour = hour % 12 || 12;
            return `${displayHour} ${period}`;
        } else {
            return `${hour.toString().padStart(2, '0')}:00`;
        }
    }
    
    /**
     * Format time for display
     * @param {Date} date - Date object
     * @returns {string} Formatted time
     */
    function formatTime(date) {
        // Get hour format from settings (12 or 24)
        const settings = Storage.getSettings();
        const hourFormat = settings.hourFormat || 24;
        
        const hours = date.getHours();
        const minutes = date.getMinutes();
        
        if (hourFormat === 12) {
            const period = hours >= 12 ? 'PM' : 'AM';
            const displayHour = hours % 12 || 12;
            return `${displayHour}:${minutes.toString().padStart(2, '0')} ${period}`;
        } else {
            return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        }
    }
    
    /**
     * Refresh the timeline display
     */
    function refresh() {
        renderActivities();
        updateCurrentTimeIndicator();
    }
    
    // Public API
    return {
        init,
        refresh
    };
})(); 