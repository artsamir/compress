// JSON Email Extractor JavaScript

// Email regex pattern that matches most email formats
const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

// Stricter validation for final emails
const EMAIL_VALIDATION_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

let extractedData = {
    emails: [],
    duplicates: new Map(),
    invalid: [],
    jsonObject: null,
    totalItems: 0
};

document.addEventListener('DOMContentLoaded', function () {
    initializeExtractor();
});

function initializeExtractor() {
    // Get elements
    const jsonInput = document.getElementById('json-input');
    const extractBtn = document.getElementById('extract-btn');
    const copyAllBtn = document.getElementById('copy-all-btn');
    const clearJsonBtn = document.getElementById('clear-json-btn');
    const clearResultsBtn = document.getElementById('clear-results-btn');
    const downloadCsvBtn = document.getElementById('download-csv-btn');
    const formatJsonBtn = document.getElementById('format-json-btn');
    const sampleJsonBtn = document.getElementById('sample-json-btn');
    const charCount = document.getElementById('char-count');
    const tabButtons = document.querySelectorAll('.tab-btn');

    // Character count
    jsonInput.addEventListener('input', function () {
        charCount.textContent = this.value.length;
    });

    // Extract button
    extractBtn.addEventListener('click', extractEmails);

    // Copy all button
    copyAllBtn.addEventListener('click', copyAllEmails);

    // Clear buttons
    clearJsonBtn.addEventListener('click', clearJson);
    clearResultsBtn.addEventListener('click', clearResults);

    // Download CSV
    downloadCsvBtn.addEventListener('click', downloadAsCSV);

    // Format JSON
    formatJsonBtn.addEventListener('click', formatJson);

    // Sample JSON
    sampleJsonBtn.addEventListener('click', loadSampleJson);

    // Tab buttons
    tabButtons.forEach(btn => {
        btn.addEventListener('click', function () {
            switchTab(this.getAttribute('data-tab'));
        });
    });
}

function extractEmails() {
    const jsonInput = document.getElementById('json-input').value.trim();

    if (!jsonInput) {
        showToast('❌ Please paste JSON data first', 'error');
        return;
    }

    try {
        // Parse JSON
        extractedData.jsonObject = JSON.parse(jsonInput);
        
        // Convert to string to search for emails
        const jsonString = JSON.stringify(extractedData.jsonObject);
        
        // Extract all potential emails
        const potentialEmails = jsonString.match(EMAIL_REGEX) || [];
        
        // Count total items
        extractedData.totalItems = countJsonItems(extractedData.jsonObject);
        
        // Process emails
        extractedData.emails = [];
        extractedData.duplicates.clear();
        extractedData.invalid = [];
        
        const seenEmails = new Map();
        const validEmails = [];
        
        potentialEmails.forEach(email => {
            const lowercaseEmail = email.toLowerCase();
            
            // Validate email
            if (EMAIL_VALIDATION_REGEX.test(email)) {
                validEmails.push(email);
                
                // Track duplicates
                if (seenEmails.has(lowercaseEmail)) {
                    seenEmails.set(lowercaseEmail, seenEmails.get(lowercaseEmail) + 1);
                } else {
                    seenEmails.set(lowercaseEmail, 1);
                }
            } else {
                extractedData.invalid.push(email);
            }
        });
        
        // Separate unique and duplicate emails
        validEmails.forEach(email => {
            const lowercaseEmail = email.toLowerCase();
            if (seenEmails.get(lowercaseEmail) > 1) {
                extractedData.duplicates.set(lowercaseEmail, seenEmails.get(lowercaseEmail));
            } else {
                extractedData.emails.push(email);
            }
        });
        
        // Sort emails
        extractedData.emails.sort();
        
        // Update UI
        updateResults();
        
        showToast(`✅ Found ${extractedData.emails.length} unique emails from ${extractedData.totalItems} items`, 'success');
        
        // Enable buttons
        document.getElementById('copy-all-btn').disabled = false;
        document.getElementById('download-csv-btn').disabled = false;
        
    } catch (error) {
        showToast(`❌ Invalid JSON: ${error.message}`, 'error');
    }
}

function updateResults() {
    updateEmailsList();
    updateDuplicatesList();
    updateInvalidList();
    updateCounts();
    updateJsonPreview();
}

function updateEmailsList() {
    const emailsList = document.getElementById('emails-list');
    
    if (extractedData.emails.length === 0) {
        emailsList.innerHTML = '<div class="empty-state"><p>🔍 No emails found</p></div>';
        return;
    }
    
    emailsList.innerHTML = extractedData.emails.map((email, index) => `
        <div class="email-item">
            <div class="email-text">
                <span class="email-icon">📧</span>
                <div>
                    <div class="email-address">${escapeHtml(email)}</div>
                    <div class="email-meta">#${index + 1}</div>
                </div>
            </div>
            <div class="email-actions">
                <button class="copy-email-btn" onclick="copySingleEmail('${escapeHtml(email)}', this)">📋 Copy</button>
            </div>
        </div>
    `).join('');
}

function updateDuplicatesList() {
    const duplicatesList = document.getElementById('duplicates-list');
    
    if (extractedData.duplicates.size === 0) {
        duplicatesList.innerHTML = '<div class="empty-state"><p>✨ No duplicate emails</p></div>';
        return;
    }
    
    const duplicatesArray = Array.from(extractedData.duplicates.entries());
    duplicatesList.innerHTML = duplicatesArray.map((item, index) => {
        const [email, count] = item;
        return `
            <div class="email-item">
                <div class="email-text">
                    <span class="email-icon">🔄</span>
                    <div>
                        <div class="email-address">${escapeHtml(email)}</div>
                        <div class="duplicate-badge">Found ${count} times</div>
                    </div>
                </div>
                <div class="email-actions">
                    <button class="copy-email-btn" onclick="copySingleEmail('${escapeHtml(email)}', this)">📋 Copy</button>
                </div>
            </div>
        `;
    }).join('');
}

function updateInvalidList() {
    const invalidList = document.getElementById('invalid-list');
    const uniqueInvalid = [...new Set(extractedData.invalid)];
    
    if (uniqueInvalid.length === 0) {
        invalidList.innerHTML = '<div class="empty-state"><p>✨ No invalid emails</p></div>';
        return;
    }
    
    invalidList.innerHTML = uniqueInvalid.map((email, index) => `
        <div class="email-item">
            <div class="email-text">
                <span class="email-icon">⚠️</span>
                <div>
                    <div class="email-address">${escapeHtml(email)}</div>
                    <div class="invalid-badge">Invalid format</div>
                </div>
            </div>
            <div class="email-actions">
                <button class="copy-email-btn" onclick="copySingleEmail('${escapeHtml(email)}', this)">📋 Copy</button>
            </div>
        </div>
    `).join('');
}

function updateCounts() {
    document.getElementById('email-count').textContent = extractedData.emails.length + ' emails found';
    document.getElementById('total-items').textContent = extractedData.totalItems + ' items parsed';
    document.getElementById('email-result-count').textContent = extractedData.emails.length;
    document.getElementById('duplicate-result-count').textContent = extractedData.duplicates.size;
    document.getElementById('invalid-result-count').textContent = [...new Set(extractedData.invalid)].length;
}

function updateJsonPreview() {
    const previewBox = document.getElementById('json-preview');
    const noJson = document.getElementById('no-json');
    
    if (!extractedData.jsonObject) {
        previewBox.style.display = 'none';
        noJson.style.display = 'flex';
        return;
    }
    
    noJson.style.display = 'none';
    previewBox.style.display = 'block';
    previewBox.innerHTML = formatJsonForDisplay(extractedData.jsonObject, 0);
}

function formatJsonForDisplay(obj, depth = 0) {
    const indent = '  '.repeat(depth);
    const nextIndent = '  '.repeat(depth + 1);
    
    if (obj === null) return '<span class="null">null</span>';
    if (typeof obj === 'string') return `<span class="string">"${escapeHtml(obj)}"</span>`;
    if (typeof obj === 'number') return `<span class="number">${obj}</span>`;
    if (typeof obj === 'boolean') return `<span class="boolean">${obj}</span>`;
    
    if (Array.isArray(obj)) {
        if (obj.length === 0) return '[]';
        const items = obj.slice(0, 10).map(item => 
            `${nextIndent}${formatJsonForDisplay(item, depth + 1)}`
        ).join(',\n');
        const more = obj.length > 10 ? `${nextIndent}<span class="comment">... +${obj.length - 10} more items</span>\n` : '';
        return `[\n${items}${more ? ',\n' + more : ''}\n${indent}]`;
    }
    
    if (typeof obj === 'object') {
        const keys = Object.keys(obj).slice(0, 5);
        const items = keys.map(key => 
            `${nextIndent}<span class="key">"${key}"</span>: ${formatJsonForDisplay(obj[key], depth + 1)}`
        ).join(',\n');
        const more = Object.keys(obj).length > 5 ? `${nextIndent}<span class="comment">... +${Object.keys(obj).length - 5} more keys</span>\n` : '';
        return `{\n${items}${more ? ',\n' + more : ''}\n${indent}}`;
    }
    
    return String(obj);
}

function copyAllEmails() {
    const allEmails = extractedData.emails.join('\n');
    
    if (!allEmails) {
        showToast('❌ No emails to copy', 'error');
        return;
    }
    
    navigator.clipboard.writeText(allEmails).then(() => {
        showToast(`✅ Copied ${extractedData.emails.length} emails to clipboard`, 'success');
    }).catch(() => {
        showToast('❌ Failed to copy to clipboard', 'error');
    });
}

function copySingleEmail(email, button) {
    navigator.clipboard.writeText(email).then(() => {
        const originalText = button.textContent;
        button.textContent = '✅ Copied!';
        button.classList.add('copied');
        
        setTimeout(() => {
            button.textContent = originalText;
            button.classList.remove('copied');
        }, 2000);
    }).catch(() => {
        showToast('❌ Failed to copy email', 'error');
    });
}

function clearJson() {
    document.getElementById('json-input').value = '';
    document.getElementById('char-count').textContent = '0';
    showToast('🗑️ JSON input cleared', 'info');
}

function clearResults() {
    extractedData.emails = [];
    extractedData.duplicates.clear();
    extractedData.invalid = [];
    extractedData.jsonObject = null;
    
    document.getElementById('copy-all-btn').disabled = true;
    document.getElementById('download-csv-btn').disabled = true;
    
    updateResults();
    showToast('🗑️ Results cleared', 'info');
}

function formatJson() {
    const jsonInput = document.getElementById('json-input');
    const value = jsonInput.value.trim();
    
    if (!value) {
        showToast('❌ No JSON to format', 'error');
        return;
    }
    
    try {
        const parsed = JSON.parse(value);
        jsonInput.value = JSON.stringify(parsed, null, 2);
        document.getElementById('char-count').textContent = jsonInput.value.length;
        showToast('✨ JSON formatted successfully', 'success');
    } catch (error) {
        showToast(`❌ Invalid JSON: ${error.message}`, 'error');
    }
}

function loadSampleJson() {
    const sampleJson = {
        "status": "success",
        "users": [
            {
                "id": 1,
                "name": "John Doe",
                "email": "john.doe@example.com",
                "contact_email": "john@work.com"
            },
            {
                "id": 2,
                "name": "Jane Smith",
                "email": "jane.smith@example.com"
            },
            {
                "id": 3,
                "name": "Bob Johnson",
                "email": "bob@company.com",
                "backup_email": "bob.j@mail.com"
            },
            {
                "id": 4,
                "name": "Alice Brown",
                "email": "alice.brown@example.com"
            },
            {
                "id": 5,
                "name": "Charlie Wilson",
                "email": "charlie@work.com",
                "contact": "charlie.w@mail.com"
            }
        ],
        "admins": [
            {
                "name": "Admin User",
                "email": "admin@example.com"
            }
        ]
    };
    
    document.getElementById('json-input').value = JSON.stringify(sampleJson, null, 2);
    document.getElementById('char-count').textContent = document.getElementById('json-input').value.length;
    showToast('📋 Sample JSON loaded', 'success');
}

function switchTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Deactivate all buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected tab
    document.getElementById(tabName + '-tab').classList.add('active');
    
    // Activate button
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
}

function downloadAsCSV() {
    if (extractedData.emails.length === 0) {
        showToast('❌ No emails to download', 'error');
        return;
    }
    
    // Prepare CSV content
    let csv = 'Email,Status,Count\n';
    
    // Add unique emails
    extractedData.emails.forEach(email => {
        csv += `"${email}",Unique,1\n`;
    });
    
    // Add duplicate emails
    extractedData.duplicates.forEach((count, email) => {
        csv += `"${email}",Duplicate,${count}\n`;
    });
    
    // Create blob and download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `emails_${new Date().getTime()}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast(`📥 Downloaded ${extractedData.emails.length + extractedData.duplicates.size} emails as CSV`, 'success');
}

function countJsonItems(obj) {
    let count = 0;
    
    function traverse(item) {
        if (item === null || item === undefined) {
            count++;
        } else if (typeof item === 'object') {
            if (Array.isArray(item)) {
                item.forEach(traverse);
            } else {
                Object.values(item).forEach(traverse);
            }
        } else {
            count++;
        }
    }
    
    traverse(obj);
    return count;
}

function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideIn 0.3s ease-out reverse';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}
