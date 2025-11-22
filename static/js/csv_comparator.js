// CSV Comparator JavaScript

let comparisonData = {
    file1: null,
    file2: null,
    file1Rows: [],
    file2Rows: [],
    file1Column: null,
    file2Column: null,
    results: [],
    matchCount: 0,
    mismatchCount: 0,
    comparisonMode: 'rowwise' // 'rowwise' or 'lookup'
};

document.addEventListener('DOMContentLoaded', function () {
    initializeComparator();
});

function initializeComparator() {
    // File inputs
    const file1Input = document.getElementById('file1-input');
    const file2Input = document.getElementById('file2-input');
    const compareBtn = document.getElementById('compare-btn');
    const previewBtn = document.getElementById('preview-btn');
    const downloadCsvBtn = document.getElementById('download-csv-btn');
    const downloadExcelBtn = document.getElementById('download-excel-btn');
    const resetBtn = document.getElementById('reset-btn');

    // File 1
    file1Input.addEventListener('change', function (e) {
        handleFileUpload(e, 1);
    });

    // File 2
    file2Input.addEventListener('change', function (e) {
        handleFileUpload(e, 2);
    });

    // Drag and drop for File 1
    setupDragDrop('file1-input');
    setupDragDrop('file2-input');

    // Compare button
    compareBtn.addEventListener('click', performComparison);

    // Comparison mode change - show/hide multi-field settings
    document.getElementById('comparison-mode').addEventListener('change', function() {
        const multifieldSettings = document.getElementById('multifield-settings');
        if (this.value === 'multifield') {
            multifieldSettings.style.display = 'block';
        } else {
            multifieldSettings.style.display = 'none';
        }
    });

    // Download buttons
    downloadCsvBtn.addEventListener('click', downloadAsCSV);
    downloadExcelBtn.addEventListener('click', downloadAsExcel);

    // Reset button
    resetBtn.addEventListener('click', resetComparator);

    // Column selectors
    document.getElementById('file1-column').addEventListener('change', updateCompareButton);
    document.getElementById('file2-column').addEventListener('change', updateCompareButton);
}

function setupDragDrop(inputId) {
    const input = document.getElementById(inputId);
    const dropZone = input.nextElementSibling;

    dropZone.addEventListener('click', () => input.click());

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => {
            dropZone.classList.add('dragover');
        });
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => {
            dropZone.classList.remove('dragover');
        });
    });

    dropZone.addEventListener('drop', (e) => {
        const files = e.dataTransfer.files;
        input.files = files;
        const event = new Event('change', { bubbles: true });
        input.dispatchEvent(event);
    });
}

function handleFileUpload(e, fileNumber) {
    const file = e.target.files[0];
    if (!file) return;

    let fileInfoId = `file1-info`;
    let columnsSection = `file1-columns-section`;
    let columnSelect = `file1-column`;

    if (fileNumber === 2) {
        fileInfoId = `file2-info`;
        columnsSection = `file2-columns-section`;
        columnSelect = `file2-column`;
    }

    const reader = new FileReader();
    reader.onload = function (event) {
        try {
            let rows = [];
            
            // Check if it's an Excel file
            if (file.name.endsWith('.xlsx')) {
                // For XLSX, we would need a library like xlsx.js
                // For now, show a message
                showToast('📝 Note: XLSX support requires additional setup. Using CSV format recommended.', 'info');
                return;
            }

            // Parse CSV
            const csv = event.target.result;
            rows = parseCSV(csv);

            if (rows.length === 0) {
                showToast('❌ No data found in file', 'error');
                return;
            }

            // Store data
            if (fileNumber === 1) {
                comparisonData.file1Rows = rows;
            } else {
                comparisonData.file2Rows = rows;
            }

            // Update UI
            updateFileInfo(fileNumber, file.name, rows.length);
            populateColumnSelect(fileNumber, rows[0]);
            updateCompareButton();

        } catch (error) {
            showToast(`❌ Error reading file: ${error.message}`, 'error');
        }
    };

    reader.readAsText(file);
}

function parseCSV(csv) {
    const lines = csv.trim().split('\n');
    const rows = [];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Simple CSV parsing (handles basic cases)
        const cells = [];
        let current = '';
        let insideQuotes = false;

        for (let j = 0; j < line.length; j++) {
            const char = line[j];
            if (char === '"') {
                insideQuotes = !insideQuotes;
            } else if (char === ',' && !insideQuotes) {
                cells.push(current.replace(/^"|"$/g, ''));
                current = '';
            } else {
                current += char;
            }
        }
        cells.push(current.replace(/^"|"$/g, ''));

        rows.push(cells);
    }

    return rows;
}

function updateFileInfo(fileNumber, fileName, rowCount) {
    const infoId = fileNumber === 1 ? 'file1-info' : 'file2-info';
    const infoBox = document.getElementById(infoId);

    infoBox.innerHTML = `
        <div class="file-name">📄 ${escapeHtml(fileName)}</div>
        <div class="file-details">
            Rows: <strong>${rowCount}</strong> | Columns: <strong>${(fileNumber === 1 ? comparisonData.file1Rows[0] : comparisonData.file2Rows[0])?.length || 0}</strong>
        </div>
    `;
    infoBox.classList.add('active');
}

function populateColumnSelect(fileNumber, headers) {
    const selectId = fileNumber === 1 ? 'file1-column' : 'file2-column';
    const sectionId = fileNumber === 1 ? 'file1-columns-section' : 'file2-columns-section';
    const select = document.getElementById(selectId);
    const section = document.getElementById(sectionId);

    // Clear existing options
    select.innerHTML = '<option value="">-- Choose Column --</option>';

    // Add column options
    headers.forEach((header, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = `${header} (Column ${String.fromCharCode(65 + index)})`;
        select.appendChild(option);
    });

    section.style.display = 'block';

    // Also populate multi-field column selectors
    populateMultiFieldSelectors(fileNumber, headers);
}

function populateMultiFieldSelectors(fileNumber, headers) {
    // Populate email and datetime column selectors for multi-field comparison
    const emailSelectId = fileNumber === 1 ? 'file1-email-col' : 'file2-email-col';
    const dateTimeSelectId = fileNumber === 1 ? 'file1-datetime-col' : 'file2-datetime-col';
    
    const emailSelect = document.getElementById(emailSelectId);
    const dateTimeSelect = document.getElementById(dateTimeSelectId);

    if (!emailSelect || !dateTimeSelect) return;

    // Clear existing options
    emailSelect.innerHTML = '<option value="">-- Choose Email Column --</option>';
    dateTimeSelect.innerHTML = '<option value="">-- Choose DateTime Column --</option>';

    // Add column options
    headers.forEach((header, index) => {
        // Add to email selector
        const emailOption = document.createElement('option');
        emailOption.value = index;
        emailOption.textContent = `${header} (Column ${String.fromCharCode(65 + index)})`;
        emailSelect.appendChild(emailOption);

        // Add to datetime selector
        const dateTimeOption = document.createElement('option');
        dateTimeOption.value = index;
        dateTimeOption.textContent = `${header} (Column ${String.fromCharCode(65 + index)})`;
        dateTimeSelect.appendChild(dateTimeOption);
    });
}

function updateCompareButton() {
    const file1Col = document.getElementById('file1-column').value;
    const file2Col = document.getElementById('file2-column').value;
    const compareBtn = document.getElementById('compare-btn');

    if (comparisonData.file1Rows.length > 0 && 
        comparisonData.file2Rows.length > 0 && 
        file1Col !== '' && 
        file2Col !== '') {
        compareBtn.disabled = false;
    } else {
        compareBtn.disabled = true;
    }
}

function performComparison() {
    const file1Col = parseInt(document.getElementById('file1-column').value);
    const file2Col = parseInt(document.getElementById('file2-column').value);
    const matchType = document.getElementById('match-type').value;
    const showFormat = document.getElementById('show-format').value;
    const showAllRows = document.getElementById('show-all-rows').checked;
    const comparisonMode = document.getElementById('comparison-mode').value;

    // Show loading animation
    showLoadingAnimation();
    document.getElementById('results-section').style.display = 'block';

    comparisonData.file1Column = file1Col;
    comparisonData.file2Column = file2Col;
    comparisonData.comparisonMode = comparisonMode;
    comparisonData.results = [];
    comparisonData.matchCount = 0;
    comparisonData.mismatchCount = 0;

    // Use setTimeout to allow loading animation to render
    setTimeout(() => {
        if (comparisonMode === 'rowwise') {
            performRowwiseComparison(file1Col, file2Col, matchType, showFormat);
        } else if (comparisonMode === 'lookup') {
            performLookupComparison(file1Col, file2Col, matchType, showFormat);
        } else if (comparisonMode === 'multifield') {
            // Multi-field comparison
            const file1EmailCol = parseInt(document.getElementById('file1-email-col').value);
            const file1DateTimeCol = parseInt(document.getElementById('file1-datetime-col').value);
            const file2EmailCol = parseInt(document.getElementById('file2-email-col').value);
            const file2DateTimeCol = parseInt(document.getElementById('file2-datetime-col').value);

            if (file1EmailCol === '' || file1DateTimeCol === '' || file2EmailCol === '' || file2DateTimeCol === '') {
                showToast('❌ Please select all required columns for multi-field comparison', 'error');
                return;
            }

            performMultiFieldComparison(file1EmailCol, file1DateTimeCol, file2EmailCol, file2DateTimeCol, matchType, showFormat);
        }

        // Update UI
        displayResults(showAllRows);
        updateStatistics();

        showToast(`✅ Comparison complete: ${comparisonData.matchCount} matches, ${comparisonData.mismatchCount} mismatches`, 'success');
    }, 100);
}

function performRowwiseComparison(file1Col, file2Col, matchType, showFormat) {
    // Skip header row (index 0)
    const maxRows = Math.max(comparisonData.file1Rows.length - 1, comparisonData.file2Rows.length - 1);

    for (let i = 1; i <= maxRows; i++) {
        const row1 = comparisonData.file1Rows[i];
        const row2 = comparisonData.file2Rows[i];

        const value1 = row1 ? row1[file1Col] || '' : '';
        const value2 = row2 ? row2[file2Col] || '' : '';

        let isMatch = compareValues(value1, value2, matchType);
        
        if (isMatch) {
            comparisonData.matchCount++;
        } else {
            comparisonData.mismatchCount++;
        }

        comparisonData.results.push({
            rowNum: i,
            value1,
            value2,
            isMatch,
            showFormat,
            matchedRow: null
        });
    }
}

function performLookupComparison(file1Col, file2Col, matchType, showFormat) {
    // File 1 is the compare file - search for each value in File 2
    for (let i = 1; i < comparisonData.file1Rows.length; i++) {
        const row1 = comparisonData.file1Rows[i];
        const value1 = row1 ? row1[file1Col] || '' : '';

        if (!value1) continue;

        // Search for this value in File 2
        let foundMatch = false;
        let matchedRow = null;

        for (let j = 1; j < comparisonData.file2Rows.length; j++) {
            const row2 = comparisonData.file2Rows[j];
            const value2 = row2 ? row2[file2Col] || '' : '';

            if (compareValues(value1, value2, matchType)) {
                foundMatch = true;
                matchedRow = j;
                break;
            }
        }

        if (foundMatch) {
            comparisonData.matchCount++;
        } else {
            comparisonData.mismatchCount++;
        }

        comparisonData.results.push({
            rowNum: i,
            value1,
            value2: foundMatch ? comparisonData.file2Rows[matchedRow][file2Col] : 'NOT FOUND',
            isMatch: foundMatch,
            showFormat,
            matchedRow: matchedRow
        });
    }
}

function compareValues(val1, val2, matchType) {
    if (matchType === 'exact') {
        return val1 === val2;
    } else if (matchType === 'case-insensitive') {
        return String(val1).toLowerCase() === String(val2).toLowerCase();
    } else if (matchType === 'partial') {
        const str1 = String(val1).toLowerCase();
        const str2 = String(val2).toLowerCase();
        return str1.includes(str2) || str2.includes(str1);
    }
    return false;
}

function performMultiFieldComparison(file1EmailCol, file1DateTimeCol, file2EmailCol, file2DateTimeCol, matchType, showFormat) {
    // Multi-field comparison: Match Email + DateTime combination
    // For each row in File 1, search for matching Email + DateTime in File 2
    
    for (let i = 1; i < comparisonData.file1Rows.length; i++) {
        const row1 = comparisonData.file1Rows[i];
        const email1 = row1 ? row1[file1EmailCol] || '' : '';
        const datetime1 = row1 ? row1[file1DateTimeCol] || '' : '';

        if (!email1 || !datetime1) continue;

        // Search for matching Email + DateTime combination in File 2
        let foundMatch = false;
        let matchedRow = null;
        let matchedEmail = '';
        let matchedDateTime = '';

        for (let j = 1; j < comparisonData.file2Rows.length; j++) {
            const row2 = comparisonData.file2Rows[j];
            const email2 = row2 ? row2[file2EmailCol] || '' : '';
            const datetime2 = row2 ? row2[file2DateTimeCol] || '' : '';

            // Check if both email and datetime match
            const emailMatches = compareValues(email1, email2, matchType);
            const datetimeMatches = compareValues(datetime1, datetime2, 'exact'); // DateTime should be exact match

            if (emailMatches && datetimeMatches) {
                foundMatch = true;
                matchedRow = j;
                matchedEmail = email2;
                matchedDateTime = datetime2;
                break;
            }
        }

        if (foundMatch) {
            comparisonData.matchCount++;
        } else {
            comparisonData.mismatchCount++;
        }

        comparisonData.results.push({
            rowNum: i,
            value1: `${email1} | ${datetime1}`,
            value2: foundMatch ? `${matchedEmail} | ${matchedDateTime}` : 'NOT FOUND',
            isMatch: foundMatch,
            showFormat,
            matchedRow: matchedRow,
            email1: email1,
            datetime1: datetime1,
            email2: matchedEmail,
            datetime2: matchedDateTime
        });
    }
}

function displayResults(showAllRows) {
    const tbody = document.getElementById('comparison-tbody');
    const thead = document.querySelector('#comparison-table thead tr');
    tbody.innerHTML = '';

    // Update table headers based on comparison mode
    let headerLabels = ['File 1 Value', 'File 2 Value'];
    if (comparisonData.comparisonMode === 'multifield') {
        headerLabels = ['File 1 (Email | DateTime)', 'File 2 (Email | DateTime)'];
    }
    
    // Update header if needed
    const thElements = thead.querySelectorAll('th');
    if (thElements.length > 1) {
        thElements[1].textContent = headerLabels[0];
        thElements[2].textContent = headerLabels[1];
    }

    let rowsToShow = comparisonData.results;
    if (!showAllRows) {
        rowsToShow = rowsToShow.filter(r => !r.isMatch);
    }

    if (rowsToShow.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center">No results to display</td></tr>';
        return;
    }

    rowsToShow.forEach((result, index) => {
        const tr = document.createElement('tr');
        const statusClass = result.isMatch ? 'status-match' : 'status-mismatch';
        const statusText = result.isMatch ? '✅ Match' : '❌ Not Found';
        const rowClass = result.isMatch ? 'row-match' : 'row-mismatch';

        let statusContent = '';
        if (result.showFormat === 'highlight' || result.showFormat === 'both') {
            statusContent += `<div class="status-badge ${statusClass}" style="${result.isMatch ? 'background-color: #d4edda; color: #155724;' : 'background-color: #f8d7da; color: #721c24;'}">${statusText}</div>`;
        }
        if (result.showFormat === 'text' || result.showFormat === 'both') {
            statusContent += `<div>${statusText}</div>`;
        }

        tr.className = rowClass;
        
        // For lookup and multifield modes, show matched row number
        let rowInfo = '';
        if ((comparisonData.comparisonMode === 'lookup' || comparisonData.comparisonMode === 'multifield') && result.matchedRow) {
            rowInfo = `<br><small style="color: #667eea; font-weight: 600;">File 2 Row: ${result.matchedRow}</small>`;
        }

        tr.innerHTML = `
            <td>${result.rowNum}</td>
            <td>${escapeHtml(String(result.value1))}</td>
            <td>${escapeHtml(String(result.value2))}${rowInfo}</td>
            <td>${statusContent}</td>
        `;
        tbody.appendChild(tr);
    });
}

function updateStatistics() {
    const total = comparisonData.matchCount + comparisonData.mismatchCount;
    const percentage = total > 0 ? Math.round((comparisonData.matchCount / total) * 100) : 0;

    document.getElementById('total-rows').textContent = total;
    document.getElementById('match-count').textContent = comparisonData.matchCount;
    document.getElementById('mismatch-count').textContent = comparisonData.mismatchCount;
    document.getElementById('match-percentage').textContent = percentage + '%';
}

function showLoadingAnimation() {
    const tbody = document.getElementById('comparison-tbody');
    tbody.innerHTML = `
        <tr>
            <td colspan="4" class="text-center">
                <div class="loading-spinner">
                    <div class="spinner"></div>
                    <p>Comparing files...</p>
                </div>
            </td>
        </tr>
    `;
}

function hideLoadingAnimation() {
    const tbody = document.getElementById('comparison-tbody');
    if (tbody.innerHTML.includes('spinner')) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center">No comparison data</td></tr>';
    }
}



function downloadAsCSV() {
    if (comparisonData.results.length === 0) {
        showToast('❌ No data to download', 'error');
        return;
    }

    let csv = 'Row #,File 1 Value,File 2 Value,Status\n';

    comparisonData.results.forEach(result => {
        const status = result.isMatch ? 'Match' : 'Mismatch';
        const val1 = escapeCSV(String(result.value1));
        const val2 = escapeCSV(String(result.value2));
        csv += `${result.rowNum},"${val1}","${val2}","${status}"\n`;
    });

    downloadFile(csv, `comparison_${new Date().getTime()}.csv`, 'text/csv');
    showToast(`📥 Downloaded CSV with ${comparisonData.results.length} rows`, 'success');
}

function downloadAsExcel() {
    if (comparisonData.results.length === 0) {
        showToast('❌ No data to download', 'error');
        return;
    }

    // For Excel, we'll create a CSV that can be opened as Excel
    let csv = 'Row #\tFile 1 Value\tFile 2 Value\tStatus\n';

    comparisonData.results.forEach(result => {
        const status = result.isMatch ? 'Match' : 'Mismatch';
        csv += `${result.rowNum}\t${result.value1}\t${result.value2}\t${status}\n`;
    });

    downloadFile(csv, `comparison_${new Date().getTime()}.xlsx`, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    showToast(`📥 Downloaded Excel with ${comparisonData.results.length} rows`, 'success');
}

function escapeCSV(str) {
    return str.replace(/"/g, '""');
}

function downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType + ';charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function resetComparator() {
    // Reset data
    comparisonData = {
        file1: null,
        file2: null,
        file1Rows: [],
        file2Rows: [],
        file1Column: null,
        file2Column: null,
        results: [],
        matchCount: 0,
        mismatchCount: 0
    };

    // Reset UI
    document.getElementById('file1-input').value = '';
    document.getElementById('file2-input').value = '';
    document.getElementById('file1-info').classList.remove('active');
    document.getElementById('file2-info').classList.remove('active');
    document.getElementById('file1-columns-section').style.display = 'none';
    document.getElementById('file2-columns-section').style.display = 'none';
    document.getElementById('results-section').style.display = 'none';
    document.getElementById('compare-btn').disabled = true;

    showToast('🔄 Comparator reset', 'info');
}

function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return String(text).replace(/[&<>"']/g, m => map[m]);
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


