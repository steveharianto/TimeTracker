/**
 * Export Module
 * Handles exporting time tracking data
 */

const Export = (function() {
    // DOM Elements
    let exportButton;
    let exportDropdown;
    let exportJsonButton;
    let exportCsvButton;
    
    /**
     * Initialize the export functionality
     */
    function init() {
        // Get DOM elements
        exportButton = document.getElementById('export-button');
        exportDropdown = document.getElementById('export-dropdown');
        exportJsonButton = document.getElementById('export-json');
        exportCsvButton = document.getElementById('export-csv');
        
        // Set up event listeners
        exportButton.addEventListener('click', toggleExportDropdown);
        exportJsonButton.addEventListener('click', exportAsJson);
        exportCsvButton.addEventListener('click', exportAsCsv);
        
        // Close dropdown when clicking outside
        document.addEventListener('click', function(e) {
            if (!exportButton.contains(e.target) && !exportDropdown.contains(e.target)) {
                exportDropdown.classList.add('hidden');
            }
        });
    }
    
    /**
     * Toggle the export dropdown menu
     */
    function toggleExportDropdown() {
        exportDropdown.classList.toggle('hidden');
    }
    
    /**
     * Export activities as JSON file
     */
    function exportAsJson() {
        // Get all activities
        const activities = Storage.getActivities();
        
        // Create a JSON blob
        const blob = new Blob([JSON.stringify(activities, null, 2)], {
            type: 'application/json'
        });
        
        // Create download link
        downloadFile(blob, `time-tracker-export-${formatDateForFilename()}.json`);
        
        // Hide dropdown
        exportDropdown.classList.add('hidden');
    }
    
    /**
     * Export activities as CSV file
     */
    function exportAsCsv() {
        // Get all activities
        const activities = Storage.getActivities();
        
        // CSV header
        let csv = 'Date,Activity,Start Time,End Time,Duration (HH:MM:SS)\n';
        
        // Process activities for each date
        Object.keys(activities).forEach(date => {
            activities[date].forEach(activity => {
                const startDate = new Date(activity.startTime);
                const endDate = new Date(activity.endTime);
                
                // Format for CSV
                const row = [
                    date,
                    `"${activity.title.replace(/"/g, '""')}"`, // Escape quotes in title
                    formatDateTime(startDate),
                    formatDateTime(endDate),
                    TimeTracker.formatDuration(activity.duration)
                ];
                
                csv += row.join(',') + '\n';
            });
        });
        
        // Create a CSV blob
        const blob = new Blob([csv], {
            type: 'text/csv;charset=utf-8'
        });
        
        // Create download link
        downloadFile(blob, `time-tracker-export-${formatDateForFilename()}.csv`);
        
        // Hide dropdown
        exportDropdown.classList.add('hidden');
    }
    
    /**
     * Helper function to trigger file download
     * @param {Blob} blob - File content as Blob
     * @param {string} filename - Name for the downloaded file
     */
    function downloadFile(blob, filename) {
        // Create temporary download link
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        
        // Trigger download
        document.body.appendChild(link);
        link.click();
        
        // Clean up
        setTimeout(() => {
            document.body.removeChild(link);
            URL.revokeObjectURL(link.href);
        }, 100);
    }
    
    /**
     * Format date and time for CSV output
     * @param {Date} date - Date object
     * @returns {string} Formatted date and time
     */
    function formatDateTime(date) {
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const seconds = date.getSeconds().toString().padStart(2, '0');
        
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    }
    
    /**
     * Format current date for filename
     * @returns {string} Formatted date
     */
    function formatDateForFilename() {
        const now = new Date();
        const year = now.getFullYear();
        const month = (now.getMonth() + 1).toString().padStart(2, '0');
        const day = now.getDate().toString().padStart(2, '0');
        
        return `${year}${month}${day}`;
    }
    
    // Public API
    return {
        init
    };
})(); 