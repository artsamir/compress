// JSON Data Extractor JavaScript - Enhanced with Custom Fields

let extractedData = {
    allData: [],
    selectedFields: [],
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
    const quickFieldButtons = document.querySelectorAll('.quick-field-btn');
    const addCustomFieldBtn = document.getElementById('add-custom-field-btn');
    const customFieldInput = document.getElementById('custom-field-input');

    // Character count
    jsonInput.addEventListener('input', function () {
        charCount.textContent = this.value.length;
    });

    // Extract button
    extractBtn.addEventListener('click', extractData);

    // Copy all button
    copyAllBtn.addEventListener('click', copyAllData);

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

    // Quick field buttons
    quickFieldButtons.forEach(btn => {
        btn.addEventListener('click', function () {
            toggleField(this.getAttribute('data-field'), this);
        });
    });

    // Custom field input
    addCustomFieldBtn.addEventListener('click', function () {
        const fieldName = customFieldInput.value.trim();
        if (fieldName) {
            addFieldToSelected(fieldName);
            customFieldInput.value = '';
        }
    });

    customFieldInput.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            addCustomFieldBtn.click();
        }
    });
}

function toggleField(fieldName, button) {
    if (extractedData.selectedFields.includes(fieldName)) {
        extractedData.selectedFields = extractedData.selectedFields.filter(f => f !== fieldName);
        button.classList.remove('active');
    } else {
        extractedData.selectedFields.push(fieldName);
        button.classList.add('active');
    }
    updateFieldsDisplay();
}

function addFieldToSelected(fieldName) {
    if (!extractedData.selectedFields.includes(fieldName)) {
        extractedData.selectedFields.push(fieldName);
        updateFieldsDisplay();
        showToast(`✅ Added "${fieldName}" to extraction fields`, 'success');
    } else {
        showToast(`⚠️ "${fieldName}" is already selected`, 'info');
    }
}

function updateFieldsDisplay() {
    const container = document.getElementById('selected-fields-container');
    
    if (extractedData.selectedFields.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>No fields selected</p></div>';
        return;
    }

    container.innerHTML = extractedData.selectedFields.map((field, index) => `
        <div class="field-badge">
            <span>${escapeHtml(field)}</span>
            <span class="field-badge-remove" onclick="removeField('${escapeHtml(field)}')">×</span>
        </div>
    `).join('');
}

function removeField(fieldName) {
    extractedData.selectedFields = extractedData.selectedFields.filter(f => f !== fieldName);
    
    // Deactivate quick button if exists
    const quickBtn = document.querySelector(`[data-field="${fieldName}"]`);
    if (quickBtn) {
        quickBtn.classList.remove('active');
    }
    
    updateFieldsDisplay();
}

function extractData() {
    const jsonInput = document.getElementById('json-input').value.trim();

    if (!jsonInput) {
        showToast('❌ Please paste JSON data first', 'error');
        return;
    }

    if (extractedData.selectedFields.length === 0) {
        showToast('❌ Please select at least one field to extract', 'error');
        return;
    }

    try {
        // Parse JSON
        extractedData.jsonObject = JSON.parse(jsonInput);
        
        // Count total items
        extractedData.totalItems = countJsonItems(extractedData.jsonObject);
        
        // Extract data
        extractedData.allData = extractFieldsFromJson(
            extractedData.jsonObject,
            extractedData.selectedFields
        );

        // Update UI
        updateResults();
        
        showToast(`✅ Extracted ${extractedData.allData.length} records with selected fields`, 'success');
        
        // Enable buttons
        document.getElementById('copy-all-btn').disabled = false;
        document.getElementById('download-csv-btn').disabled = false;
        
    } catch (error) {
        showToast(`❌ Invalid JSON: ${error.message}`, 'error');
    }
}

function extractFieldsFromJson(obj, fields) {
    const results = [];

    function traverse(item) {
        if (item === null || item === undefined) return;

        if (Array.isArray(item)) {
            item.forEach(traverse);
        } else if (typeof item === 'object') {
            // Check if this object has any of the selected fields
            const hasAnyField = fields.some(field => field in item);
            
            if (hasAnyField) {
                const record = {};
                fields.forEach(field => {
                    record[field] = item[field] !== undefined ? item[field] : '';
                });
                results.push(record);
            }

            // Also traverse nested objects
            Object.values(item).forEach(traverse);
        }
    }

    traverse(obj);
    return results;
}

function updateResults() {
    updateResultsList();
    updateStats();
    updateCounts();
    updateJsonPreview();
}

function updateResultsList() {
    const resultsList = document.getElementById('results-list');
    
    if (extractedData.allData.length === 0) {
        resultsList.innerHTML = '<div class="empty-state"><p>📭 No data found</p></div>';
        return;
    }
    
    // Create table
    let tableHtml = `
        <table class="results-table">
            <thead>
                <tr>
                    <th style="width: 50px; text-align: center;">No.</th>
                    ${extractedData.selectedFields.map(field => `<th>${escapeHtml(field)}</th>`).join('')}
                    <th style="width: 100px; text-align: center;">Action</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    extractedData.allData.forEach((record, index) => {
        const fieldValues = extractedData.selectedFields.map(field => `
            <td>${escapeHtml(String(record[field] || '-'))}</td>
        `).join('');
        
        tableHtml += `
            <tr>
                <td style="text-align: center; font-weight: 600; color: #667eea;">${index + 1}</td>
                ${fieldValues}
                <td style="text-align: center;">
                    <button class="copy-result-btn" onclick="copyResultRow(${index}, this)">📋 Copy</button>
                </td>
            </tr>
        `;
    });
    
    tableHtml += `
            </tbody>
        </table>
    `;
    
    resultsList.innerHTML = tableHtml;
}

function copyResultRow(index, button) {
    const record = extractedData.allData[index];
    let text = extractedData.selectedFields.map(field => `${field}: ${record[field]}`).join('\n');
    
    navigator.clipboard.writeText(text).then(() => {
        const originalText = button.textContent;
        button.textContent = '✅ Copied!';
        button.classList.add('copied');
        
        setTimeout(() => {
            button.textContent = originalText;
            button.classList.remove('copied');
        }, 2000);
    }).catch(() => {
        showToast('❌ Failed to copy', 'error');
    });
}

function updateStats() {
    const statsContent = document.getElementById('stats-content');
    
    if (extractedData.allData.length === 0) {
        statsContent.innerHTML = '<div class="empty-state"><p>📊 No data to analyze</p></div>';
        return;
    }

    let statsHtml = `
        <div class="stat-item">
            <div class="stat-label">Total Records</div>
            <div class="stat-value">${extractedData.allData.length}</div>
        </div>
        <div class="stat-item">
            <div class="stat-label">Selected Fields</div>
            <div class="stat-value">${extractedData.selectedFields.length}</div>
        </div>
    `;

    // Field-specific stats
    extractedData.selectedFields.forEach(field => {
        const values = extractedData.allData.map(r => r[field]);
        const nonEmpty = values.filter(v => v && v.toString().trim() !== '').length;
        const empty = values.length - nonEmpty;

        statsHtml += `
            <div class="stat-item">
                <div class="stat-label">Field: ${escapeHtml(field)}</div>
                <div class="stat-detail">Filled: ${nonEmpty} | Empty: ${empty}</div>
            </div>
        `;
    });

    statsContent.innerHTML = statsHtml;
}

function updateCounts() {
    document.getElementById('results-count').textContent = extractedData.allData.length + ' items found';
    document.getElementById('total-items').textContent = extractedData.totalItems + ' items parsed';
    document.getElementById('result-count').textContent = extractedData.allData.length;
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

function copyAllData() {
    if (extractedData.allData.length === 0) {
        showToast('❌ No data to copy', 'error');
        return;
    }

    // Create CSV format
    const headers = extractedData.selectedFields;
    let csv = headers.join(',') + '\n';
    
    extractedData.allData.forEach(record => {
        const row = headers.map(field => {
            const value = record[field];
            // Escape quotes and wrap in quotes if contains comma
            const escaped = String(value || '').replace(/"/g, '""');
            return escaped.includes(',') ? `"${escaped}"` : escaped;
        });
        csv += row.join(',') + '\n';
    });

    navigator.clipboard.writeText(csv).then(() => {
        showToast(`✅ Copied ${extractedData.allData.length} records to clipboard`, 'success');
    }).catch(() => {
        showToast('❌ Failed to copy to clipboard', 'error');
    });
}

function clearJson() {
    document.getElementById('json-input').value = '';
    document.getElementById('char-count').textContent = '0';
    showToast('🗑️ JSON input cleared', 'info');
}

function clearResults() {
    extractedData.allData = [];
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
        "total": 5,
        "users": [
            {
                "id": 1001,
                "first_name": "John",
                "last_name": "Doe",
                "email": "john.doe@example.com",
                "phone": "9876543210",
                "organization_id": "ORG-001",
                "password": "hashed_pwd_123",
                "username": "johndoe"
            },
            {
                "id": 1002,
                "first_name": "Jane",
                "last_name": "Smith",
                "email": "jane.smith@example.com",
                "phone": "9876543211",
                "organization_id": "ORG-001",
                "username": "janesmith"
            },
            {
                "id": 1003,
                "first_name": "Bob",
                "last_name": "Johnson",
                "email": "bob.j@company.com",
                "phone": "9876543212",
                "organization_id": "ORG-002",
                "password": "hashed_pwd_456"
            },
            {
                "id": 1004,
                "first_name": "Alice",
                "last_name": "Brown",
                "email": "alice@example.com",
                "phone": "9876543213",
                "organization_id": "ORG-002"
            },
            {
                "id": 1005,
                "first_name": "Charlie",
                "last_name": "Wilson",
                "email": "charlie@example.com",
                "phone": "9876543214",
                "organization_id": "ORG-003",
                "password": "hashed_pwd_789"
            }
        ]
    };
    
    document.getElementById('json-input').value = JSON.stringify(sampleJson, null, 2);
    document.getElementById('char-count').textContent = document.getElementById('json-input').value.length;
    showToast('📋 Sample JSON loaded - try extracting "id", "first_name", "email", or "phone"', 'success');
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
    if (extractedData.allData.length === 0) {
        showToast('❌ No data to download', 'error');
        return;
    }
    
    // Create CSV content
    const headers = extractedData.selectedFields;
    let csv = headers.map(h => `"${h}"`).join(',') + '\n';
    
    extractedData.allData.forEach(record => {
        const row = headers.map(field => {
            const value = record[field];
            const escaped = String(value || '').replace(/"/g, '""');
            return `"${escaped}"`;
        });
        csv += row.join(',') + '\n';
    });

    // Create blob and download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `extracted_data_${new Date().getTime()}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast(`📥 Downloaded ${extractedData.allData.length} records as CSV`, 'success');
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
