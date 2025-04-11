/**
 * Storage Module
 * Handles all localStorage operations for the Time Tracker application
 */

const Storage = (function() {
    // Storage keys
    const STORAGE_KEYS = {
        ACTIVITIES: 'timeTracker_activities',
        CURRENT_ACTIVITY: 'timeTracker_currentActivity',
        SETTINGS: 'timeTracker_settings'
    };

    // Default settings
    const DEFAULT_SETTINGS = {
        theme: 'light',
        hourFormat: 24
    };

    /**
     * Initialize storage with default values if needed
     */
    function init() {
        if (!localStorage.getItem(STORAGE_KEYS.ACTIVITIES)) {
            localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify({}));
        }
        
        if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
            localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
        }
    }

    /**
     * Get all activities from storage
     * @returns {Object} Activities grouped by date
     */
    function getActivities() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEYS.ACTIVITIES)) || {};
        } catch (e) {
            console.error('Error parsing activities from storage:', e);
            return {};
        }
    }

    /**
     * Get activities for a specific date
     * @param {string} date - Date in ISO format (YYYY-MM-DD)
     * @returns {Array} Activities for the specified date
     */
    function getActivitiesByDate(date) {
        const activities = getActivities();
        return activities[date] || [];
    }

    /**
     * Save activities to storage
     * @param {Object} activities - Activities grouped by date
     */
    function saveActivities(activities) {
        localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(activities));
    }

    /**
     * Add or update an activity for a specific date
     * @param {string} date - Date in ISO format (YYYY-MM-DD)
     * @param {Object} activity - Activity object to save
     */
    function saveActivity(date, activity) {
        const activities = getActivities();
        
        if (!activities[date]) {
            activities[date] = [];
        }
        
        // If activity has an ID, update it; otherwise, add as new
        const existingIndex = activities[date].findIndex(a => a.id === activity.id);
        
        if (existingIndex >= 0) {
            activities[date][existingIndex] = activity;
        } else {
            activities[date].push(activity);
        }
        
        saveActivities(activities);
    }

    /**
     * Delete an activity
     * @param {string} date - Date in ISO format (YYYY-MM-DD)
     * @param {string} activityId - ID of the activity to delete
     * @returns {boolean} True if deleted, false if not found
     */
    function deleteActivity(date, activityId) {
        const activities = getActivities();
        
        if (!activities[date]) {
            return false;
        }
        
        const initialLength = activities[date].length;
        activities[date] = activities[date].filter(a => a.id !== activityId);
        
        if (activities[date].length < initialLength) {
            saveActivities(activities);
            return true;
        }
        
        return false;
    }

    /**
     * Get current activity from storage
     * @returns {Object|null} Current activity or null if none
     */
    function getCurrentActivity() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEYS.CURRENT_ACTIVITY));
        } catch (e) {
            console.error('Error parsing current activity from storage:', e);
            return null;
        }
    }

    /**
     * Save current activity to storage
     * @param {Object|null} activity - Current activity or null to clear
     */
    function saveCurrentActivity(activity) {
        if (activity) {
            localStorage.setItem(STORAGE_KEYS.CURRENT_ACTIVITY, JSON.stringify(activity));
        } else {
            localStorage.removeItem(STORAGE_KEYS.CURRENT_ACTIVITY);
        }
    }

    /**
     * Get settings from storage
     * @returns {Object} Application settings
     */
    function getSettings() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEYS.SETTINGS)) || DEFAULT_SETTINGS;
        } catch (e) {
            console.error('Error parsing settings from storage:', e);
            return DEFAULT_SETTINGS;
        }
    }

    /**
     * Save settings to storage
     * @param {Object} settings - Settings to save
     */
    function saveSettings(settings) {
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    }

    /**
     * Clear all application data from storage
     */
    function clearAllData() {
        localStorage.removeItem(STORAGE_KEYS.ACTIVITIES);
        localStorage.removeItem(STORAGE_KEYS.CURRENT_ACTIVITY);
        localStorage.removeItem(STORAGE_KEYS.SETTINGS);
        init();
    }

    // Public API
    return {
        init,
        getActivities,
        getActivitiesByDate,
        saveActivity,
        deleteActivity,
        getCurrentActivity,
        saveCurrentActivity,
        getSettings,
        saveSettings,
        clearAllData
    };
})();

// Initialize storage when script loads
Storage.init(); 