// Note Progress Tracker Logic

// 1. App State
let state = {
    isEditMode: false,
    courses: []
};

// Available Tasks per module
const TASKS = [
    { id: 'note', label: 'Note Completed' },
    { id: 'short_note', label: 'Short Note Done' },
    { id: 'rev_1', label: 'Revision 1' },
    { id: 'rev_2', label: 'Revision 2' }
];

const DEFAULT_COURSES = [
    "CSCI 12513 - Mathematics for Computer Science II",
    "CSCI 12523 - Probability Distribution and Applications",
    "CSCI 12532 - Computer Architecture and Design",
    "CSCI 12542 - Structured Programming II",
    "CSCI12552 - Fundamentals of Operating Systems",
    "CSCI 12562 - Web Programming",
    "CSCI 12572 - Software Engineering"
];

// Load from LocalStorage on mount
function loadState() {
    const saved = localStorage.getItem('noteProgressTrackerState');
    if (saved) {
        try {
            state = JSON.parse(saved);
        } catch (e) {
            console.error("Failed to load state", e);
        }
    } else {
        // Sample default state if empty
        state.isEditMode = false;
        state.courses = DEFAULT_COURSES.map(title => ({
            id: generateId(),
            title: title,
            isCollapsed: true, // Collapsed by default for a clean view
            modules: []
        }));
        saveState();
    }

    // Auto-replace 'Example Course' with real courses if they haven't modified it yet
    if (state.courses.length === 1 && state.courses[0].title === "Example Course") {
        state.courses = DEFAULT_COURSES.map(title => ({
            id: generateId(),
            title: title,
            isCollapsed: true,
            modules: []
        }));
        saveState();
    }
}

// Save to LocalStorage
function saveState() {
    localStorage.setItem('noteProgressTrackerState', JSON.stringify(state));
}

// Utils
function generateId() {
    return Math.random().toString(36).substring(2, 10);
}

// DOM Elements
const coursesContainer = document.getElementById('courses-container');
const btnAddCourse = document.getElementById('btn-add-course');
const globalProgressText = document.getElementById('global-progress-text');
const globalProgressFill = document.getElementById('global-progress-fill');
const modeToggleCheckbox = document.getElementById('mode-toggle-checkbox');

// Toggle Mode
function toggleMode(e) {
    state.isEditMode = e.target.checked;
    saveState();
    document.body.classList.toggle('edit-mode', state.isEditMode);
}

// Actions
function addCourse() {
    const title = prompt("Enter Course Name:");
    if (title && title.trim().length > 0) {
        const newCourse = {
            id: generateId(),
            title: title.trim(),
            isCollapsed: false,
            modules: []
        };
        state.courses.push(newCourse);
        saveState();
        render();
    }
}

function toggleCourse(courseId) {
    const course = state.courses.find(c => c.id === courseId);
    if (course) {
        course.isCollapsed = !course.isCollapsed;
        saveState();
        render();
    }
}

function deleteCourse(courseId, event) {
    if (event) event.stopPropagation(); // Prevent course collapse toggle
    if (confirm("Are you sure you want to delete this course?")) {
        state.courses = state.courses.filter(c => c.id !== courseId);
        saveState();
        render();
    }
}

function addModule(courseId) {
    const title = prompt("Enter Module Name:");
    if (title && title.trim().length > 0) {
        const course = state.courses.find(c => c.id === courseId);
        if (course) {
            course.modules.push({
                id: generateId(),
                title: title.trim(),
                tasks: { note: false, short_note: false, rev_1: false, rev_2: false },
                taskTimestamps: {},
                completedAt: null,
                noteLink: null,
                shortNoteLink: null
            });
            course.isCollapsed = false; // Automatically expand the course to reveal the new module
            saveState();
            render();
        }
    }
}

function deleteModule(courseId, moduleId) {
    if (confirm("Are you sure you want to delete this module?")) {
        const course = state.courses.find(c => c.id === courseId);
        if (course) {
            course.modules = course.modules.filter(m => m.id !== moduleId);
            saveState();
            render();
        }
    }
}

function setLink(courseId, moduleId, type) {
    const course = state.courses.find(c => c.id === courseId);
    if (!course) return;
    const module = course.modules.find(m => m.id === moduleId);
    if (!module) return;

    const linkName = type === 'noteLink' ? 'Note' : 'Short Note';
    const currentLink = module[type] || '';
    const newLink = prompt(`Enter Google Drive URL for ${linkName}:`, currentLink);

    if (newLink !== null) {
        module[type] = newLink.trim() === '' ? null : newLink.trim();
        saveState();
        render();
    }
}

function openLink(courseId, moduleId, type) {
    const course = state.courses.find(c => c.id === courseId);
    if (!course) return;
    const module = course.modules.find(m => m.id === moduleId);
    if (!module) return;

    if (module[type]) {
        window.open(module[type], '_blank');
    } else {
        // Prompt user to set it if it's missing
        setLink(courseId, moduleId, type);
    }
}

function toggleTask(courseId, moduleId, taskId) {
    const course = state.courses.find(c => c.id === courseId);
    if (!course) return;
    const module = course.modules.find(m => m.id === moduleId);
    if (!module) return;

    module.tasks[taskId] = !module.tasks[taskId];
    module.taskTimestamps = module.taskTimestamps || {};
    
    if (module.tasks[taskId]) {
        const now = new Date();
        module.taskTimestamps[taskId] = now.toLocaleDateString() + ' ' + now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    } else {
        module.taskTimestamps[taskId] = null;
    }

    // Check if all tasks are completed
    let allCompleted = true;
    TASKS.forEach(t => {
        if (!module.tasks[t.id]) allCompleted = false;
    });

    if (allCompleted && !module.completedAt) {
        const now = new Date();
        module.completedAt = now.toLocaleDateString() + ' ' + now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    } else if (!allCompleted) {
        module.completedAt = null;
    }

    saveState();
    updateProgressDisplay();
    render(); // Re-render to show/hide timestamp
}

// Progress Calculations
function calculateCourseProgress(course) {
    if (!course.modules || course.modules.length === 0) return 0;
    
    let totalTasks = course.modules.length * TASKS.length;
    let completedTasks = 0;

    course.modules.forEach(mod => {
        TASKS.forEach(task => {
            if (mod.tasks[task.id]) completedTasks++;
        });
    });

    return Math.round((completedTasks / totalTasks) * 100);
}

function calculateGlobalProgress() {
    if (state.courses.length === 0) return 0;

    let totalTasks = 0;
    let completedTasks = 0;

    state.courses.forEach(course => {
        course.modules.forEach(mod => {
            totalTasks += TASKS.length;
            TASKS.forEach(task => {
                if (mod.tasks[task.id]) completedTasks++;
            });
        });
    });

    if (totalTasks === 0) return 0;
    return Math.round((completedTasks / totalTasks) * 100);
}

// Rendering
function updateProgressDisplay() {
    // Global
    const globalProg = calculateGlobalProgress();
    globalProgressText.textContent = `${globalProg}%`;
    globalProgressFill.style.width = `${globalProg}%`;

    // Courses
    state.courses.forEach(course => {
        const prog = calculateCourseProgress(course);
        const textEl = document.getElementById(`course-prog-text-${course.id}`);
        const fillEl = document.getElementById(`course-prog-fill-${course.id}`);
        if(textEl) textEl.textContent = `${prog}%`;
        if(fillEl) fillEl.style.width = `${prog}%`;
    });
}

function render() {
    coursesContainer.innerHTML = '';

    state.courses.forEach(course => {
        const courseProgress = calculateCourseProgress(course);
        const isCollapsed = course.isCollapsed ? 'collapsed' : '';
        const rotatedClass = course.isCollapsed ? 'collapsed-icon' : '';

        const courseHTML = `
            <div class="course-card glass-panel" id="course-${course.id}">
                <div class="course-header" onclick="toggleCourse('${course.id}')">
                    <span class="material-symbols-rounded collapse-icon ${rotatedClass}">expand_more</span>
                    <div class="course-title-group">
                        <h2 class="course-title">${course.title}</h2>
                        <div class="course-progress-container">
                            <div class="progress-info">
                                <span>Course Progress</span>
                                <span id="course-prog-text-${course.id}">${courseProgress}%</span>
                            </div>
                            <div class="progress-bar-bg">
                                <div class="progress-bar-fill" id="course-prog-fill-${course.id}" style="width: ${courseProgress}%"></div>
                            </div>
                        </div>
                    </div>
                    <div class="header-actions edit-only">
                        <button class="btn-icon" onclick="deleteCourse('${course.id}', event)" title="Delete Course">
                            <span class="material-symbols-rounded">delete</span>
                        </button>
                    </div>
                </div>

                <div class="modules-container ${isCollapsed}">
                    ${course.modules.map(mod => `
                        <div class="module-card">
                            <div class="module-header">
                                <h3 class="module-title">
                                    ${mod.title}
                                    ${mod.completedAt ? `<span class="timestamp"><span class="material-symbols-rounded" style="font-size: 14px; vertical-align: middle;">done_all</span> ${mod.completedAt}</span>` : ''}
                                </h3>
                                <button class="btn-icon edit-only" onclick="deleteModule('${course.id}', '${mod.id}')" title="Delete Module">
                                    <span class="material-symbols-rounded">close</span>
                                </button>
                            </div>

                            <div class="module-links-container">
                                <div class="link-group">
                                    <button class="btn-link" onclick="openLink('${course.id}', '${mod.id}', 'noteLink')">
                                        <span class="material-symbols-rounded" style="font-size:18px;">description</span> 
                                        ${mod.noteLink ? 'View Note' : 'Add Note'}
                                    </button>
                                    <button class="btn-icon-small edit-only" onclick="setLink('${course.id}', '${mod.id}', 'noteLink')" title="Edit Note Link">
                                        <span class="material-symbols-rounded">edit</span>
                                    </button>
                                </div>
                                <div class="link-group">
                                    <button class="btn-link" onclick="openLink('${course.id}', '${mod.id}', 'shortNoteLink')">
                                        <span class="material-symbols-rounded" style="font-size:18px;">sticky_note_2</span> 
                                        ${mod.shortNoteLink ? 'View Short Note' : 'Add Short Note'}
                                    </button>
                                    <button class="btn-icon-small edit-only" onclick="setLink('${course.id}', '${mod.id}', 'shortNoteLink')" title="Edit Short Note Link">
                                        <span class="material-symbols-rounded">edit</span>
                                    </button>
                                </div>
                            </div>

                            <div class="tasks-grid">
                                ${TASKS.map(task => {
                                    const ts = (mod.taskTimestamps && mod.taskTimestamps[task.id]) ? mod.taskTimestamps[task.id] : null;
                                    return `
                                    <label class="task-label">
                                        <input type="checkbox" onchange="toggleTask('${course.id}', '${mod.id}', '${task.id}')" ${mod.tasks[task.id] ? 'checked' : ''}>
                                        <div class="custom-checkbox">
                                            <span class="material-symbols-rounded">check</span>
                                        </div>
                                        <div class="task-info">
                                            <span class="task-text">${task.label}</span>
                                            ${ts ? `<span class="task-timestamp">${ts}</span>` : ''}
                                        </div>
                                    </label>
                                    `;
                                }).join('')}
                            </div>
                        </div>
                    `).join('')}
                </div>

                <button class="btn-icon-add edit-only" onclick="addModule('${course.id}')">
                    <span class="material-symbols-rounded">add</span>
                    Add Module
                </button>
            </div>
        `;
        coursesContainer.insertAdjacentHTML('beforeend', courseHTML);
    });

    updateProgressDisplay();
}

// Init
btnAddCourse.addEventListener('click', addCourse);
modeToggleCheckbox.addEventListener('change', toggleMode);

window.onload = () => {
    loadState();
    
    // Apply initial state for Edit Mode
    if (state.isEditMode) {
        document.body.classList.add('edit-mode');
        modeToggleCheckbox.checked = true;
    }

    render();
};
