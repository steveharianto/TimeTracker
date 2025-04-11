/**
 * Main Application
 * Initializes all modules and handles the activity list display
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize modules
    initializeApp();
});

/**
 * Initialize the application
 */
function initializeApp() {
    // Initialize modules
    TimeTracker.init();
    Timeline.init();
    Export.init();
    
    // Set up date and time display
    updateDateTime();
    setInterval(updateDateTime, 1000);
    
    // Render activity list
    renderActivityList();
}

/**
 * Update date and time display
 */
function updateDateTime() {
    const now = new Date();
    
    // Update date display (e.g., "Monday, January 1, 2023")
    const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const formattedDate = now.toLocaleDateString(undefined, dateOptions);
    document.getElementById('current-date').textContent = formattedDate;
    
    // Update time display (e.g., "12:34:56")
    const timeOptions = { hour: '2-digit', minute: '2-digit', second: '2-digit' };
    const formattedTime = now.toLocaleTimeString(undefined, timeOptions);
    document.getElementById('current-time').textContent = formattedTime;
}

/**
 * Render the activity list table
 */
function renderActivityList() {
    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];
    
    // Get activities for today
    const activities = Storage.getActivitiesByDate(today);
    
    // Get table body element
    const activityList = document.getElementById('activity-list');
    
    // Clear existing rows
    activityList.innerHTML = '';
    
    // If no activities, show empty message
    if (activities.length === 0) {
        const emptyRow = document.createElement('tr');
        emptyRow.innerHTML = `
            <td colspan="5" class="py-4 px-4 text-center text-gray-500">
                No activities recorded today. Click "Start Action" to begin tracking.
            </td>
        `;
        activityList.appendChild(emptyRow);
        return;
    }
    
    // Sort activities by start time (newest first)
    const sortedActivities = [...activities].sort((a, b) => b.startTime - a.startTime);
    
    // Create a row for each activity
    sortedActivities.forEach(activity => {
        const row = document.createElement('tr');
        row.className = 'border-b border-gray-200 hover:bg-gray-50';
        row.dataset.id = activity.id;
        
        // Create date objects for formatting
        const startDate = new Date(activity.startTime);
        const endDate = new Date(activity.endTime);
        
        // Format times
        const startTime = formatTime(startDate);
        const endTime = formatTime(endDate);
        const duration = TimeTracker.formatDuration(activity.duration);
        
        // Create row content
        row.innerHTML = `
            <td class="py-3 px-4">
                <div class="flex items-center">
                    <div class="w-3 h-3 rounded-full mr-2" style="background-color: ${activity.color}"></div>
                    <span class="activity-title" data-id="${activity.id}">${activity.title}</span>
                </div>
            </td>
            <td class="py-3 px-4">${startTime}</td>
            <td class="py-3 px-4">${endTime}</td>
            <td class="py-3 px-4">${duration}</td>
            <td class="py-3 px-4">
                <button class="edit-activity-btn text-primary hover:text-blue-700 mr-3" data-id="${activity.id}">
                    Edit
                </button>
                <button class="delete-activity-btn text-danger hover:text-red-700" data-id="${activity.id}">
                    Delete
                </button>
            </td>
        `;
        
        // Add to activity list
        activityList.appendChild(row);
    });
    
    // Add event listeners for edit and delete buttons
    addActivityListEventListeners();
}

/**
 * Add event listeners to the activity list elements
 */
function addActivityListEventListeners() {
    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];
    
    // Edit activity title
    document.querySelectorAll('.edit-activity-btn').forEach(button => {
        button.addEventListener('click', function() {
            const activityId = this.dataset.id;
            const activities = Storage.getActivitiesByDate(today);
            const activity = activities.find(a => a.id === activityId);
            
            if (activity) {
                // Find the title element
                const titleElement = document.querySelector(`.activity-title[data-id="${activityId}"]`);
                
                // Create input element
                const input = document.createElement('input');
                input.type = 'text';
                input.value = activity.title;
                input.className = 'border rounded px-2 py-1 w-full';
                
                // Replace title with input
                const parent = titleElement.parentNode;
                parent.replaceChild(input, titleElement);
                input.focus();
                
                // Save on blur or Enter key
                input.addEventListener('blur', saveActivityTitle);
                input.addEventListener('keydown', function(e) {
                    if (e.key === 'Enter') {
                        saveActivityTitle.call(this);
                    }
                });
                
                // Save function
                function saveActivityTitle() {
                    const newTitle = this.value.trim();
                    if (newTitle) {
                        // Update activity title
                        activity.title = newTitle;
                        Storage.saveActivity(today, activity);
                        
                        // Refresh displays
                        renderActivityList();
                        Timeline.refresh();
                    }
                }
            }
        });
    });
    
    // Delete activity
    document.querySelectorAll('.delete-activity-btn').forEach(button => {
        button.addEventListener('click', function() {
            const activityId = this.dataset.id;
            
            // Confirm deletion
            if (confirm('Are you sure you want to delete this activity?')) {
                // Delete from storage
                Storage.deleteActivity(today, activityId);
                
                // Refresh displays
                renderActivityList();
                Timeline.refresh();
            }
        });
    });
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

// Export function for other modules to call
window.refreshActivityList = renderActivityList; 