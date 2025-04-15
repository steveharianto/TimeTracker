// DOM Elements
const actionBtn = document.getElementById('actionBtn');
const currentAction = document.getElementById('currentAction');
const currentActionTitle = document.getElementById('currentActionTitle');
const currentActionTime = document.getElementById('currentActionTime');
const currentActionDuration = document.getElementById('currentActionDuration');
const timeline = document.getElementById('timeline');
const emptyState = document.getElementById('emptyState');
const exportBtn = document.getElementById('exportBtn');
const prevDateBtn = document.getElementById('prevDate');
const nextDateBtn = document.getElementById('nextDate');
const dateDisplay = document.getElementById('dateDisplay');

// App State
let state = {
  actions: [],
  currentAction: null,
  timerInterval: null,
  selectedDate: new Date().toISOString().split('T')[0] // Default to today
};

// Initialize the app
function init() {
  loadActions();
  renderTimeline();
  checkForRunningAction();
  updateDateDisplay();
  
  // Event Listeners
  actionBtn.addEventListener('click', toggleAction);
  exportBtn.addEventListener('click', exportData);
  prevDateBtn.addEventListener('click', navigateToPreviousDay);
  nextDateBtn.addEventListener('click', navigateToNextDay);
  
  // Check if we need to resume a running action (page reload)
  window.addEventListener('beforeunload', saveState);
}

// Navigate to previous day
function navigateToPreviousDay() {
  const date = new Date(state.selectedDate);
  date.setDate(date.getDate() - 1);
  state.selectedDate = date.toISOString().split('T')[0];
  loadActions();
  renderTimeline();
  updateDateDisplay();
  toggleActionButtonVisibility();
}

// Navigate to next day
function navigateToNextDay() {
  const date = new Date(state.selectedDate);
  date.setDate(date.getDate() + 1);
  state.selectedDate = date.toISOString().split('T')[0];
  loadActions();
  renderTimeline();
  updateDateDisplay();
  toggleActionButtonVisibility();
}

// Update the date display based on the selected date
function updateDateDisplay() {
  const today = new Date().toISOString().split('T')[0];
  const selectedDate = new Date(state.selectedDate);
  
  // Format the date
  const options = { weekday: 'short', month: 'short', day: 'numeric' };
  const formattedDate = selectedDate.toLocaleDateString(undefined, options);
  
  if (state.selectedDate === today) {
    dateDisplay.textContent = "Today's Timeline";
  } else {
    dateDisplay.textContent = formattedDate;
  }
  
  // Disable next button if we're on today
  if (state.selectedDate === today) {
    nextDateBtn.classList.add('opacity-50', 'cursor-not-allowed');
    nextDateBtn.disabled = true;
  } else {
    nextDateBtn.classList.remove('opacity-50', 'cursor-not-allowed');
    nextDateBtn.disabled = false;
  }
}

// Show/hide action button based on selected date
function toggleActionButtonVisibility() {
  const today = new Date().toISOString().split('T')[0];
  
  if (state.selectedDate === today) {
    actionBtn.parentElement.classList.remove('hidden');
  } else {
    // Hide action controls for past days
    actionBtn.parentElement.classList.add('hidden');
    
    // Hide current action UI if visible
    if (!currentAction.classList.contains('hidden')) {
      currentAction.classList.add('hidden');
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
    title: 'New Action',
    start: now.toISOString(),
    isRunning: true
  };
  
  // Update UI
  currentActionTitle.value = state.currentAction.title;
  showCurrentAction();
  updateActionButton('Stop');
  startActionTimer(state.currentAction);
  saveState();
}

// Stop the current action
function stopAction() {
  const now = new Date();
  const action = state.currentAction;
  
  // Update the action
  action.end = now.toISOString();
  action.isRunning = false;
  action.title = currentActionTitle.value.trim() || 'Unnamed Action';
  action.duration = calculateDuration(new Date(action.start), now);
  
  // Add to actions list and clear current
  state.actions.push(action);
  state.currentAction = null;
  
  // Stop the timer
  clearInterval(state.timerInterval);
  state.timerInterval = null;
  
  // Update UI
  hideCurrentAction();
  updateActionButton('Start Action');
  renderTimeline();
  saveState();
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

// Show the current action UI
function showCurrentAction() {
  currentAction.classList.remove('hidden');
}

// Hide the current action UI
function hideCurrentAction() {
  currentAction.classList.add('hidden');
}

// Update the action button text
function updateActionButton(text) {
  actionBtn.textContent = text;
  if (text === 'Stop') {
    actionBtn.classList.remove('bg-blue-600', 'hover:bg-blue-700');
    actionBtn.classList.add('bg-red-600', 'hover:bg-red-700');
  } else {
    actionBtn.classList.remove('bg-red-600', 'hover:bg-red-700');
    actionBtn.classList.add('bg-blue-600', 'hover:bg-blue-700');
  }
}

// Render the timeline of actions
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
  } else {
    emptyState.classList.add('hidden');
    
    // Sort actions by start time (newest first)
    const sortedActions = [...state.actions].sort((a, b) => {
      return new Date(b.start) - new Date(a.start);
    });
    
    // Render each action
    sortedActions.forEach(action => {
      const actionElement = createActionElement(action);
      timeline.insertBefore(actionElement, emptyState);
    });
  }
}

// Create a DOM element for an action
function createActionElement(action) {
  const actionElement = document.createElement('div');
  actionElement.classList.add('action-item', 'p-3', 'border', 'rounded', 'shadow-sm');
  actionElement.dataset.id = action.id;
  
  const start = new Date(action.start);
  const end = new Date(action.end);
  
  actionElement.innerHTML = `
    <div class="flex justify-between items-start">
      <h3 class="action-title font-medium text-lg" 
          contenteditable="false" 
          data-id="${action.id}">${action.title}</h3>
      <button class="delete-action text-gray-400 hover:text-red-500" data-id="${action.id}">
        &times;
      </button>
    </div>
    <div class="text-sm text-gray-600 mt-1">
      ${formatTime(start)} - ${formatTime(end)}
      <span class="ml-2 font-mono">(${formatDuration(action.duration)})</span>
    </div>
  `;
  
  // Add event listeners for editing and deleting
  const titleElement = actionElement.querySelector('.action-title');
  titleElement.addEventListener('click', function() {
    this.contentEditable = true;
    this.focus();
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
    state.actions[actionIndex].title = newTitle.trim() || 'Unnamed Action';
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
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
  
  return [
    hours.toString().padStart(2, '0'),
    minutes.toString().padStart(2, '0'),
    secs.toString().padStart(2, '0')
  ].join(':');
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