// DOM Elements
const actionBtn = document.getElementById('actionBtn');
const currentAction = document.getElementById('currentAction');
const currentActionTitle = document.getElementById('currentActionTitle');
const currentActionTime = document.getElementById('currentActionTime');
const currentActionDuration = document.getElementById('currentActionDuration');
const timeline = document.getElementById('timeline');
const emptyState = document.getElementById('emptyState');
const exportBtn = document.getElementById('exportBtn');
const importBtn = document.getElementById('importBtn');
const importFile = document.getElementById('importFile');
const prevDateBtn = document.getElementById('prevDate');
const nextDateBtn = document.getElementById('nextDate');
const dateDisplay = document.getElementById('dateDisplay');
const actionControls = document.getElementById('actionControls');

// Calendar elements
const calendarToggle = document.getElementById('calendarToggle');
const calendarView = document.getElementById('calendarView');
const prevMonthBtn = document.getElementById('prevMonth');
const nextMonthBtn = document.getElementById('nextMonth');
const currentMonthDisplay = document.getElementById('currentMonth');
const calendarGrid = document.querySelector('.calendar-grid');

// App State
let state = {
  actions: [],
  currentAction: null,
  timerInterval: null,
  selectedDate: new Date().toISOString().split('T')[0], // Default to today
  calendarDate: new Date(), // Date to display in calendar
  showCalendar: false // Calendar visibility toggle
};

// Initialize the app
function init() {
  loadActions();
  renderTimeline();
  checkForRunningAction();
  updateDateDisplay();
  
  // Make sure the action button has proper classes
  actionBtn.classList.add('bg-blue-600');
  
  // Event Listeners
  actionBtn.addEventListener('click', toggleAction);
  exportBtn.addEventListener('click', exportData);
  importBtn.addEventListener('click', () => importFile.click());
  importFile.addEventListener('change', importData);
  prevDateBtn.addEventListener('click', navigateToPreviousDay);
  nextDateBtn.addEventListener('click', navigateToNextDay);
  currentActionTitle.addEventListener('focus', () => currentActionTitle.select());
  
  // Calendar event listeners
  calendarToggle.addEventListener('click', toggleCalendar);
  prevMonthBtn.addEventListener('click', () => navigateCalendar(-1));
  nextMonthBtn.addEventListener('click', () => navigateCalendar(1));
  
  // Add keyboard shortcuts for better UX
  document.addEventListener('keydown', (e) => {
    // Start/stop with Spacebar when no input is focused
    if (e.code === 'Space' && document.activeElement.tagName !== 'INPUT' && state.selectedDate === new Date().toISOString().split('T')[0]) {
      e.preventDefault();
      toggleAction();
    }
    
    // Navigate with left/right arrow keys
    if (e.code === 'ArrowLeft' && !prevDateBtn.disabled) {
      e.preventDefault();
      navigateToPreviousDay();
    }
    
    if (e.code === 'ArrowRight' && !nextDateBtn.disabled) {
      e.preventDefault();
      navigateToNextDay();
    }
  });
  
  // Check if we need to save on page close
  window.addEventListener('beforeunload', saveState);
  
  // Show a focused UI
  timeline.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
}

// Toggle calendar visibility with animation
function toggleCalendar() {
  state.showCalendar = !state.showCalendar;
  
  if (state.showCalendar) {
    // Show calendar with animation
    renderCalendar();
    calendarView.classList.remove('hidden');
    calendarView.style.display = 'block';
    setTimeout(() => {
      calendarView.classList.add('visible');
    }, 10);
  } else {
    // Hide calendar with animation
    calendarView.classList.remove('visible');
    calendarView.classList.add('hidden');
    setTimeout(() => {
      calendarView.style.display = 'none';
    }, 300);
  }
}

// Navigate calendar month with animation
function navigateCalendar(monthOffset) {
  // Apply exit animation to current month
  calendarGrid.classList.add(monthOffset > 0 ? 'slide-in-right' : 'slide-in-left');
  
  // After animation completes, update the date and render
  setTimeout(() => {
    const newDate = new Date(state.calendarDate);
    newDate.setMonth(newDate.getMonth() + monthOffset);
    state.calendarDate = newDate;
    renderCalendar();
    
    // Reset animation classes
    calendarGrid.classList.remove('slide-in-right', 'slide-in-left');
  }, 200);
}

// Render calendar for current month
function renderCalendar() {
  // Update month display
  const month = state.calendarDate.toLocaleString('default', { month: 'long' });
  const year = state.calendarDate.getFullYear();
  currentMonthDisplay.textContent = `${month} ${year}`;
  
  // Remove existing calendar days
  const calendarDays = document.querySelectorAll('.calendar-day');
  calendarDays.forEach(day => day.remove());
  
  // Get dates for calendar grid
  const calendarDates = getCalendarDates(state.calendarDate);
  
  // Get days with activities and their activity counts
  const activitiesPerDay = getActivitiesPerDay();
  
  // Create and append calendar day elements
  calendarDates.forEach(date => {
    const dayElement = document.createElement('div');
    dayElement.classList.add('calendar-day');
    
    // Create inner content div for proper centering
    const dayContent = document.createElement('div');
    dayContent.classList.add('calendar-day-content');
    
    // Add date as number
    dayContent.textContent = date.getDate();
    dayElement.appendChild(dayContent);
    
    // Add appropriate classes
    if (date.getMonth() !== state.calendarDate.getMonth()) {
      dayElement.classList.add('other-month');
    }
    
    // Check if this is today
    const dateStr = date.toISOString().split('T')[0];
    const today = new Date().toISOString().split('T')[0];
    
    if (dateStr === today) {
      dayElement.classList.add('today');
    }
    
    // Check if this is the selected date
    if (dateStr === state.selectedDate) {
      dayElement.classList.add('selected');
    }
    
    // Create activity indicators based on activity count
    if (activitiesPerDay.has(dateStr)) {
      const activityCount = activitiesPerDay.get(dateStr);
      const indicatorContainer = document.createElement('div');
      indicatorContainer.classList.add('activity-indicator');
      
      // Determine activity level (1-3) based on count
      let level = 1;
      if (activityCount >= 5) {
        level = 3;
        indicatorContainer.classList.add('level-3');
      } else if (activityCount >= 2) {
        level = 2;
        indicatorContainer.classList.add('level-2');
      } else {
        indicatorContainer.classList.add('level-1');
      }
      
      // Add the appropriate number of indicator dots
      for (let i = 0; i < level; i++) {
        const dot = document.createElement('span');
        indicatorContainer.appendChild(dot);
      }
      
      dayElement.appendChild(indicatorContainer);
    }
    
    // Add click event to select date
    dayElement.addEventListener('click', () => {
      selectDate(dateStr);
    });
    
    // Add to calendar
    calendarGrid.appendChild(dayElement);
  });
}

// Get dates for calendar grid (including prev/next month days to fill the grid)
function getCalendarDates(date) {
  const year = date.getFullYear();
  const month = date.getMonth();
  
  // First day of the month
  const firstDay = new Date(year, month, 1);
  
  // Last day of the month
  const lastDay = new Date(year, month + 1, 0);
  
  // Day of week for the first day (0 = Sunday, 6 = Saturday)
  const firstDayOfWeek = firstDay.getDay();
  
  // Total days in month
  const daysInMonth = lastDay.getDate();
  
  // Array to hold all dates to display
  const dates = [];
  
  // Previous month days to fill the first row
  const daysFromPrevMonth = firstDayOfWeek;
  const prevMonth = new Date(year, month, 0); // Last day of previous month
  const prevMonthDays = prevMonth.getDate();
  
  for (let i = daysFromPrevMonth - 1; i >= 0; i--) {
    dates.push(new Date(year, month - 1, prevMonthDays - i));
  }
  
  // Current month days
  for (let day = 1; day <= daysInMonth; day++) {
    dates.push(new Date(year, month, day));
  }
  
  // Next month days to complete the grid
  const totalCells = 42; // 6 rows of 7 days
  const remainingCells = totalCells - dates.length;
  
  for (let day = 1; day <= remainingCells; day++) {
    dates.push(new Date(year, month + 1, day));
  }
  
  return dates;
}

// Get a map of days and their activity counts
function getActivitiesPerDay() {
  const activitiesPerDay = new Map();
  
  // Get all activity dates from localStorage
  const savedData = localStorage.getItem('timeTracker');
  if (savedData) {
    const data = JSON.parse(savedData);
    
    data.actions.forEach(action => {
      const actionDate = new Date(action.start).toISOString().split('T')[0];
      
      if (activitiesPerDay.has(actionDate)) {
        activitiesPerDay.set(actionDate, activitiesPerDay.get(actionDate) + 1);
      } else {
        activitiesPerDay.set(actionDate, 1);
      }
    });
  }
  
  return activitiesPerDay;
}

// Select a date from the calendar with animation
function selectDate(dateStr) {
  // Update selected date
  state.selectedDate = dateStr;
  
  // Apply day transition animation
  timeline.classList.add('day-transition-exit');
  
  setTimeout(() => {
    // Reload timeline for the new date
    loadActions();
    renderTimeline();
    updateDateDisplay();
    toggleActionButtonVisibility();
    
    // Update calendar display
    renderCalendar();
    
    // Apply entry animation
    timeline.classList.remove('day-transition-exit');
    timeline.classList.add('day-transition-enter');
    
    setTimeout(() => {
      timeline.classList.remove('day-transition-enter');
    }, 300);
  }, 200);
}

// Import data from JSON file
function importData(e) {
  const file = e.target.files[0];
  if (!file) return;
  
  // Create a status message element
  const statusEl = createStatusMessage();
  
  const reader = new FileReader();
  reader.onload = function(event) {
    try {
      // Parse the file content
      const importedData = JSON.parse(event.target.result);
      
      // Validate the data format
      if (!Array.isArray(importedData)) {
        throw new Error('Invalid data format: Expected an array of activities');
      }
      
      // Process and validate each action
      const validActions = importedData.filter(action => {
        return action && 
               typeof action === 'object' && 
               action.id && 
               action.title && 
               action.start && 
               action.end && 
               !isNaN(new Date(action.start)) &&
               !isNaN(new Date(action.end));
      });
      
      if (validActions.length === 0) {
        throw new Error('No valid activities found in the imported file');
      }
      
      // Get existing data
      const savedData = localStorage.getItem('timeTracker');
      let existingData = { actions: [], currentAction: null };
      
      if (savedData) {
        existingData = JSON.parse(savedData);
      }
      
      // Merge with existing data, avoiding duplicates
      const existingIds = new Set(existingData.actions.map(a => a.id));
      const newActions = validActions.filter(a => !existingIds.has(a.id));
      const mergedActions = [...existingData.actions, ...newActions];
      
      // Save merged data
      localStorage.setItem('timeTracker', JSON.stringify({
        actions: mergedActions,
        currentAction: existingData.currentAction
      }));
      
      // Show success message
      showStatusMessage(statusEl, `Successfully imported ${newActions.length} activities`, false);
      
      // Reload and render
      loadActions();
      renderTimeline();
      
      // Update calendar if visible
      if (state.showCalendar) {
        renderCalendar();
      }
      
      // Reset the file input
      e.target.value = '';
      
    } catch (error) {
      console.error('Import error:', error);
      showStatusMessage(statusEl, `Import failed: ${error.message}`, true);
      e.target.value = '';
    }
  };
  
  reader.onerror = function() {
    showStatusMessage(statusEl, 'Error reading file', true);
    e.target.value = '';
  };
  
  reader.readAsText(file);
}

// Create status message element
function createStatusMessage() {
  // Remove any existing status message
  const existingStatus = document.querySelector('.status-message');
  if (existingStatus) {
    existingStatus.remove();
  }
  
  // Create new status element
  const statusEl = document.createElement('div');
  statusEl.className = 'status-message';
  document.body.appendChild(statusEl);
  
  return statusEl;
}

// Show status message
function showStatusMessage(statusEl, message, isError) {
  statusEl.textContent = message;
  if (isError) {
    statusEl.classList.add('error');
  }
  statusEl.classList.add('show');
  
  // Hide after delay
  setTimeout(() => {
    statusEl.classList.remove('show');
    setTimeout(() => statusEl.remove(), 300);
  }, 3000);
}

// Navigate to previous day with animation
function navigateToPreviousDay() {
  const date = new Date(state.selectedDate);
  date.setDate(date.getDate() - 1);
  state.selectedDate = date.toISOString().split('T')[0];
  
  // Apply exit animation
  timeline.classList.add('slide-in-right');
  timeline.style.opacity = '0';
  
  setTimeout(() => {
    loadActions();
    renderTimeline();
    updateDateDisplay();
    toggleActionButtonVisibility();
    
    // Apply entry animation
    timeline.classList.remove('slide-in-right');
    timeline.classList.add('slide-in-left');
    timeline.style.opacity = '1';
    
    // Update calendar if visible
    if (state.showCalendar) {
      if (date.getMonth() !== state.calendarDate.getMonth()) {
        state.calendarDate = new Date(date);
      }
      renderCalendar();
    }
    
    setTimeout(() => {
      timeline.classList.remove('slide-in-left');
    }, 300);
  }, 200);
}

// Navigate to next day with animation
function navigateToNextDay() {
  if (nextDateBtn.disabled) return;
  
  const date = new Date(state.selectedDate);
  date.setDate(date.getDate() + 1);
  state.selectedDate = date.toISOString().split('T')[0];
  
  // Apply exit animation
  timeline.classList.add('slide-in-left');
  timeline.style.opacity = '0';
  
  setTimeout(() => {
    loadActions();
    renderTimeline();
    updateDateDisplay();
    toggleActionButtonVisibility();
    
    // Apply entry animation
    timeline.classList.remove('slide-in-left');
    timeline.classList.add('slide-in-right');
    timeline.style.opacity = '1';
    
    // Update calendar if visible
    if (state.showCalendar) {
      if (date.getMonth() !== state.calendarDate.getMonth()) {
        state.calendarDate = new Date(date);
      }
      renderCalendar();
    }
    
    setTimeout(() => {
      timeline.classList.remove('slide-in-right');
    }, 300);
  }, 200);
}

// Update the date display based on the selected date
function updateDateDisplay() {
  const today = new Date().toISOString().split('T')[0];
  const selectedDate = new Date(state.selectedDate);
  
  // Format the date
  const options = { weekday: 'short', month: 'short', day: 'numeric' };
  const formattedDate = selectedDate.toLocaleDateString(undefined, options);
  
  if (state.selectedDate === today) {
    dateDisplay.textContent = "Today";
  } else {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    if (state.selectedDate === yesterdayStr) {
      dateDisplay.textContent = "Yesterday";
    } else {
      dateDisplay.textContent = formattedDate;
    }
  }
  
  // Handle navigation buttons
  if (state.selectedDate === today) {
    nextDateBtn.disabled = true;
    nextDateBtn.classList.add('opacity-30');
  } else {
    nextDateBtn.disabled = false;
    nextDateBtn.classList.remove('opacity-30');
  }
}

// Show/hide action button based on selected date
function toggleActionButtonVisibility() {
  const today = new Date().toISOString().split('T')[0];
  
  if (state.selectedDate === today) {
    actionControls.classList.remove('hidden');
  } else {
    actionControls.classList.add('hidden');
    
    // Stop any running action when switching from today
    if (state.currentAction) {
      clearInterval(state.timerInterval);
      state.currentAction = null;
    }
  }
}

// Load actions from localStorage
function loadActions() {
  const savedData = localStorage.getItem('timeTracker');
  
  if (savedData) {
    const data = JSON.parse(savedData);
    
    // Get actions for the selected date
    state.actions = data.actions.filter(action => {
      return new Date(action.start).toISOString().split('T')[0] === state.selectedDate;
    });
    
    // Load current action if it exists and we're on today's date
    const today = new Date().toISOString().split('T')[0];
    if (data.currentAction && state.selectedDate === today) {
      state.currentAction = data.currentAction;
    } else {
      state.currentAction = null;
    }
  }
}

// Save app state to localStorage
function saveState() {
  // Get all stored actions (all dates)
  const savedData = localStorage.getItem('timeTracker');
  let allActions = [];
  
  if (savedData) {
    const data = JSON.parse(savedData);
    // Keep actions from other dates
    allActions = data.actions.filter(action => {
      return new Date(action.start).toISOString().split('T')[0] !== state.selectedDate;
    });
  }
  
  // Combine with selected date's actions
  allActions = [...allActions, ...state.actions];
  
  // Save everything
  localStorage.setItem('timeTracker', JSON.stringify({
    actions: allActions,
    currentAction: state.currentAction
  }));
  
  // Update calendar if visible
  if (state.showCalendar) {
    renderCalendar();
  }
}

// Check if we need to resume a running action (e.g., after page reload)
function checkForRunningAction() {
  if (state.currentAction) {
    // Resume the running action
    startActionTimer(state.currentAction);
    updateActionButton('Stop');
    showCurrentAction();
  }
  
  // Show/hide action button based on selected date
  toggleActionButtonVisibility();
}

// Toggle between starting and stopping an action
function toggleAction() {
  if (state.currentAction) {
    stopAction();
  } else {
    startAction();
  }
}

// Start a new action
function startAction() {
  const now = new Date();
  
  state.currentAction = {
    id: generateUuid(),
    title: '',
    start: now.toISOString(),
    isRunning: true
  };
  
  // Update UI
  currentActionTitle.value = '';
  currentActionTitle.placeholder = 'What are you doing?';
  showCurrentAction();
  updateActionButton('Stop');
  startActionTimer(state.currentAction);
  saveState();
  
  // Focus input for immediate typing
  setTimeout(() => {
    currentActionTitle.focus();
  }, 100);
}

// Stop the current action
function stopAction() {
  const now = new Date();
  const action = state.currentAction;
  
  // Get the title - use placeholder text if empty
  action.title = currentActionTitle.value.trim() || 'Unnamed Activity';
  
  // Update the action
  action.end = now.toISOString();
  action.isRunning = false;
  action.duration = calculateDuration(new Date(action.start), now);
  
  // Add to actions list and clear current
  state.actions.push(action);
  state.currentAction = null;
  
  // Stop the timer
  clearInterval(state.timerInterval);
  state.timerInterval = null;
  
  // Update UI
  hideCurrentAction();
  updateActionButton('Start Activity');
  
  // Render the new activity at the top with animation
  renderTimeline();
  saveState();
  
  // Update calendar if visible
  if (state.showCalendar) {
    renderCalendar();
  }
}

// Start the timer for an action
function startActionTimer(action) {
  const startTime = new Date(action.start);
  
  // Format and show the start time
  currentActionTime.textContent = `Started at ${formatTime(startTime)}`;
  
  // Update duration display every second
  state.timerInterval = setInterval(() => {
    const now = new Date();
    const duration = calculateDuration(startTime, now);
    currentActionDuration.textContent = formatDuration(duration);
    currentActionDuration.classList.add('timer-active');
  }, 1000);
  
  // Trigger immediately
  const now = new Date();
  const duration = calculateDuration(startTime, now);
  currentActionDuration.textContent = formatDuration(duration);
}

// Show the current action UI with animation
function showCurrentAction() {
  currentAction.classList.remove('hidden');
  
  // Force browser to recalculate layout
  void currentAction.offsetWidth;
  
  // Apply animation
  currentAction.style.animation = 'none';
  setTimeout(() => {
    currentAction.style.animation = 'slideInDown 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
  }, 10);
}

// Hide the current action UI with animation
function hideCurrentAction() {
  currentAction.style.transform = 'translateY(-20px)';
  currentAction.style.opacity = '0';
  
  setTimeout(() => {
    currentAction.classList.add('hidden');
    currentAction.style.transform = '';
    currentAction.style.opacity = '';
  }, 300);
}

// Update the action button text
function updateActionButton(text) {
  actionBtn.textContent = text;
  if (text === 'Stop') {
    actionBtn.classList.remove('bg-blue-600');
    actionBtn.classList.add('bg-red-500');
  } else {
    actionBtn.classList.remove('bg-red-500');
    actionBtn.classList.add('bg-blue-600');
  }
}

// Render the timeline of actions with animations
function renderTimeline() {
  // Clear existing content except empty state
  const children = Array.from(timeline.children);
  children.forEach(child => {
    if (child.id !== 'emptyState') {
      timeline.removeChild(child);
    }
  });
  
  // Show/hide empty state
  if (state.actions.length === 0) {
    emptyState.classList.remove('hidden');
    emptyState.style.animation = 'fadeIn 0.3s ease forwards';
  } else {
    emptyState.classList.add('hidden');
    
    // Sort actions by start time (newest first)
    const sortedActions = [...state.actions].sort((a, b) => {
      return new Date(b.start) - new Date(a.start);
    });
    
    // Render each action with staggered animation
    sortedActions.forEach((action, index) => {
      const actionElement = createActionElement(action);
      timeline.insertBefore(actionElement, emptyState);
      
      // Apply staggered animations
      setTimeout(() => {
        actionElement.classList.add('fade-in');
      }, index * 50);
    });
  }
}

// Create a DOM element for an action
function createActionElement(action) {
  const actionElement = document.createElement('div');
  actionElement.classList.add('action-item');
  actionElement.dataset.id = action.id;
  
  const start = new Date(action.start);
  const end = new Date(action.end);
  
  actionElement.innerHTML = `
    <div class="flex justify-between items-start">
      <h3 class="action-title" 
          contenteditable="false" 
          data-id="${action.id}">${action.title}</h3>
      <button class="delete-action" aria-label="Delete" data-id="${action.id}">
        <i class="fas fa-times"></i>
      </button>
    </div>
    <div class="time-display mt-1">
      ${formatTime(start)} - ${formatTime(end)}
      <span class="duration ml-2">${formatDuration(action.duration)}</span>
    </div>
  `;
  
  // Add event listeners for editing and deleting
  const titleElement = actionElement.querySelector('.action-title');
  titleElement.addEventListener('click', function() {
    this.contentEditable = true;
    this.focus();
    document.execCommand('selectAll', false, null);
  });
  
  titleElement.addEventListener('blur', function() {
    this.contentEditable = false;
    const actionId = this.dataset.id;
    updateActionTitle(actionId, this.textContent);
  });
  
  titleElement.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      this.blur();
    }
  });
  
  const deleteBtn = actionElement.querySelector('.delete-action');
  deleteBtn.addEventListener('click', function() {
    const actionId = this.dataset.id;
    deleteAction(actionId);
  });
  
  return actionElement;
}

// Update an action's title
function updateActionTitle(actionId, newTitle) {
  const actionIndex = state.actions.findIndex(a => a.id === actionId);
  if (actionIndex !== -1) {
    state.actions[actionIndex].title = newTitle.trim() || 'Unnamed Activity';
    saveState();
  }
}

// Delete an action
function deleteAction(actionId) {
  state.actions = state.actions.filter(a => a.id !== actionId);
  renderTimeline();
  saveState();
}

// Export all data
function exportData() {
  // Get all actions from localStorage
  const savedData = localStorage.getItem('timeTracker');
  let dataToExport = [];
  
  if (savedData) {
    const data = JSON.parse(savedData);
    dataToExport = data.actions;
  }
  
  // Create and trigger download
  const dataStr = JSON.stringify(dataToExport, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const today = new Date().toISOString().split('T')[0];
  const link = document.createElement('a');
  link.href = url;
  link.download = `timetracker-${today}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Utility: Format a date to HH:MM
function formatTime(date) {
  return date.toLocaleTimeString(undefined, { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true 
  }).replace(/\s/g, '').toLowerCase();
}

// Utility: Calculate duration in seconds between two dates
function calculateDuration(start, end) {
  return Math.floor((end - start) / 1000);
}

// Utility: Format duration in seconds to HH:MM:SS
function formatDuration(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
}

// Utility: Generate a simple UUID
function generateUuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', init); 