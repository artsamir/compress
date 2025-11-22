// Resume Maker JavaScript

// Job type specific prompts
const jobTypeConfig = {
    common: {
        skills: ['Communication', 'Leadership', 'Problem Solving', 'Team Work', 'Project Management'],
        expPlaceholder: 'Describe your key responsibilities and achievements'
    },
    it: {
        skills: ['Python', 'JavaScript', 'React', 'Node.js', 'SQL', 'Cloud Services', 'Git', 'APIs', 'Problem Solving'],
        expPlaceholder: 'Describe technical implementations and project contributions'
    },
    teaching: {
        skills: ['Student Engagement', 'Curriculum Design', 'Assessment', 'Communication', 'Mentoring', 'Class Management'],
        expPlaceholder: 'Describe teaching methods, curriculum development, and student outcomes'
    }
};

// Template styling
const templateStyles = {
    modern: {
        primaryColor: '#3498db',
        accentColor: '#2c3e50',
        style: 'modern'
    },
    classic: {
        primaryColor: '#34495e',
        accentColor: '#7f8c8d',
        style: 'classic'
    },
    creative: {
        primaryColor: '#e74c3c',
        accentColor: '#e67e22',
        style: 'creative'
    },
    minimal: {
        primaryColor: '#2c3e50',
        accentColor: '#95a5a6',
        style: 'minimal'
    },
    professional: {
        primaryColor: '#34495e',
        accentColor: '#16a085',
        style: 'professional'
    }
};

// Initialize Resume Maker
document.addEventListener('DOMContentLoaded', function () {
    initializeResumeMaker();
});

function initializeResumeMaker() {
    // Get elements
    const form = document.getElementById('resume-form');
    const previewDiv = document.getElementById('resume-preview');
    const jobTypeSelect = document.getElementById('job-type');
    const templateSelect = document.getElementById('template-style');
    const themeColorInput = document.getElementById('theme-color');
    const previewBtnMobile = document.getElementById('preview-btn-mobile');
    const downloadPdfBtn = document.getElementById('download-pdf-btn');
    const downloadImageBtn = document.getElementById('download-image-btn');
    const printBtn = document.getElementById('print-btn');
    const previewModal = document.getElementById('preview-modal');
    const closeBtn = document.querySelector('.close-btn');

    // Form input fields
    const formInputs = [
        'full-name', 'email', 'phone', 'location', 'job-title', 'professional-summary',
    ];

    // Add event listeners
    jobTypeSelect.addEventListener('change', updatePreview);
    templateSelect.addEventListener('change', updateTemplate);
    themeColorInput.addEventListener('change', updateThemeColor);

    // Form inputs auto-update
    formInputs.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('input', updatePreview);
        }
    });

    // Skills
    document.getElementById('add-skill-btn').addEventListener('click', addSkill);
    document.getElementById('skills-container').addEventListener('input', updatePreview);
    document.getElementById('skills-container').addEventListener('click', handleDelete);

    // Experience
    document.getElementById('add-experience-btn').addEventListener('click', addExperience);
    document.getElementById('experience-container').addEventListener('input', updatePreview);
    document.getElementById('experience-container').addEventListener('click', handleDelete);

    // Education
    document.getElementById('add-education-btn').addEventListener('click', addEducation);
    document.getElementById('education-container').addEventListener('input', updatePreview);
    document.getElementById('education-container').addEventListener('click', handleDelete);

    // Certifications
    document.getElementById('add-cert-btn').addEventListener('click', addCertification);
    document.getElementById('certifications-container').addEventListener('input', updatePreview);
    document.getElementById('certifications-container').addEventListener('click', handleDelete);

    // Links
    document.getElementById('add-link-btn').addEventListener('click', addLink);
    document.getElementById('links-container').addEventListener('input', updatePreview);
    document.getElementById('links-container').addEventListener('click', handleDelete);

    // Mobile preview
    previewBtnMobile.addEventListener('click', showMobilePreview);
    closeBtn.addEventListener('click', closeMobilePreview);
    previewModal.addEventListener('click', function (e) {
        if (e.target === this) closeMobilePreview();
    });

    // Download and Print
    downloadPdfBtn.addEventListener('click', downloadPDF);
    downloadImageBtn.addEventListener('click', downloadImage);
    printBtn.addEventListener('click', printResume);

    // Initial render
    updatePreview();
}

function addSkill(e) {
    e.preventDefault();
    const container = document.getElementById('skills-container');
    const skillGroup = document.createElement('div');
    skillGroup.className = 'skill-input-group';
    skillGroup.innerHTML = `
        <div style="position: relative;">
            <input type="text" class="skill-input" placeholder="e.g., Python, JavaScript, Leadership">
            <button type="button" class="delete-btn">×</button>
        </div>
    `;
    container.appendChild(skillGroup);
    updatePreview();
}

function addExperience(e) {
    e.preventDefault();
    const container = document.getElementById('experience-container');
    const expItem = document.createElement('div');
    expItem.className = 'experience-item';
    expItem.innerHTML = `
        <input type="text" class="exp-job-title" placeholder="Job Title">
        <input type="text" class="exp-company" placeholder="Company Name">
        <div class="date-range">
            <input type="month" class="exp-start-date">
            <span>to</span>
            <input type="month" class="exp-end-date">
            <label class="checkbox-label">
                <input type="checkbox" class="exp-current">
                <span>Currently working here</span>
            </label>
        </div>
        <textarea class="exp-description" rows="2" placeholder="Description of responsibilities and achievements"></textarea>
        <button type="button" class="delete-btn">×</button>
    `;
    container.appendChild(expItem);
    updatePreview();
}

function addEducation(e) {
    e.preventDefault();
    const container = document.getElementById('education-container');
    const eduItem = document.createElement('div');
    eduItem.className = 'education-item';
    eduItem.innerHTML = `
        <input type="text" class="edu-degree" placeholder="Degree (e.g., Bachelor of Science)">
        <input type="text" class="edu-field" placeholder="Field of Study (e.g., Computer Science)">
        <input type="text" class="edu-institution" placeholder="University/Institution Name">
        <div class="date-range">
            <input type="month" class="edu-start-date">
            <span>to</span>
            <input type="month" class="edu-end-date">
        </div>
        <input type="text" class="edu-grade" placeholder="Grade (Optional)">
        <button type="button" class="delete-btn">×</button>
    `;
    container.appendChild(eduItem);
    updatePreview();
}

function addCertification(e) {
    e.preventDefault();
    const container = document.getElementById('certifications-container');
    const certItem = document.createElement('div');
    certItem.className = 'cert-item';
    certItem.innerHTML = `
        <input type="text" class="cert-name" placeholder="Certification Name">
        <input type="text" class="cert-issuer" placeholder="Issuing Organization">
        <input type="month" class="cert-date" placeholder="Date Issued">
        <button type="button" class="delete-btn">×</button>
    `;
    container.appendChild(certItem);
    updatePreview();
}

function addLink(e) {
    e.preventDefault();
    const container = document.getElementById('links-container');
    const linkItem = document.createElement('div');
    linkItem.className = 'link-item';
    linkItem.innerHTML = `
        <input type="text" class="link-label" placeholder="Label (e.g., Portfolio, GitHub)">
        <input type="url" class="link-url" placeholder="https://example.com">
        <button type="button" class="delete-btn">×</button>
    `;
    container.appendChild(linkItem);
    updatePreview();
}

function handleDelete(e) {
    if (e.target.classList.contains('delete-btn')) {
        e.preventDefault();
        const item = e.target.closest('.skill-input-group, .experience-item, .education-item, .cert-item, .link-item');
        if (item) {
            item.remove();
            updatePreview();
        }
    }
}

function updatePreview() {
    const previewDiv = document.getElementById('resume-preview');
    const fullName = document.getElementById('full-name').value;
    const email = document.getElementById('email').value;
    const phone = document.getElementById('phone').value;
    const location = document.getElementById('location').value;
    const jobTitle = document.getElementById('job-title').value;
    const summary = document.getElementById('professional-summary').value;

    let html = '<div class="resume-header-section">';

    if (fullName) {
        html += `<div class="resume-full-name">${escapeHtml(fullName)}</div>`;
    }

    if (jobTitle) {
        html += `<div class="resume-job-title">${escapeHtml(jobTitle)}</div>`;
    }

    // Contact Info
    html += '<div class="resume-contact-info">';
    if (email) html += `<div class="resume-contact-item">📧 ${escapeHtml(email)}</div>`;
    if (phone) html += `<div class="resume-contact-item">📞 ${escapeHtml(phone)}</div>`;
    if (location) html += `<div class="resume-contact-item">📍 ${escapeHtml(location)}</div>`;
    html += '</div>';
    html += '</div>';

    // Professional Summary
    if (summary) {
        html += `<div class="resume-section">
            <div class="resume-section-title">Professional Summary</div>
            <div class="resume-section-content">${escapeHtml(summary)}</div>
        </div>`;
    }

    // Skills
    const skills = Array.from(document.querySelectorAll('.skill-input')).map(el => el.value).filter(v => v);
    if (skills.length > 0) {
        html += `<div class="resume-section">
            <div class="resume-section-title">Skills</div>
            <div class="resume-skills">
                ${skills.map(skill => `<div class="skill-tag">${escapeHtml(skill)}</div>`).join('')}
            </div>
        </div>`;
    }

    // Work Experience
    const experiences = Array.from(document.querySelectorAll('.experience-item')).filter(item => {
        return item.querySelector('.exp-job-title').value || item.querySelector('.exp-company').value;
    });
    if (experiences.length > 0) {
        html += '<div class="resume-section"><div class="resume-section-title">Work Experience</div>';
        experiences.forEach(exp => {
            const jobTitle = exp.querySelector('.exp-job-title').value;
            const company = exp.querySelector('.exp-company').value;
            const startDate = formatDate(exp.querySelector('.exp-start-date').value);
            const endDate = exp.querySelector('.exp-current').checked ? 'Present' : formatDate(exp.querySelector('.exp-end-date').value);
            const description = exp.querySelector('.exp-description').value;

            html += `<div class="resume-item">
                <div class="resume-item-header">
                    <div>
                        <div class="resume-item-title">${escapeHtml(jobTitle)}</div>
                        <div class="resume-item-subtitle">${escapeHtml(company)}</div>
                    </div>
                </div>
                <div class="resume-item-meta">${startDate} - ${endDate}</div>
                ${description ? `<div class="resume-item-description">${escapeHtml(description)}</div>` : ''}
            </div>`;
        });
        html += '</div>';
    }

    // Education
    const educations = Array.from(document.querySelectorAll('.education-item')).filter(item => {
        return item.querySelector('.edu-degree').value || item.querySelector('.edu-institution').value;
    });
    if (educations.length > 0) {
        html += '<div class="resume-section"><div class="resume-section-title">Education</div>';
        educations.forEach(edu => {
            const degree = edu.querySelector('.edu-degree').value;
            const field = edu.querySelector('.edu-field').value;
            const institution = edu.querySelector('.edu-institution').value;
            const startDate = formatDate(edu.querySelector('.edu-start-date').value);
            const endDate = formatDate(edu.querySelector('.edu-end-date').value);
            const grade = edu.querySelector('.edu-grade').value;

            html += `<div class="resume-item">
                <div class="resume-item-header">
                    <div>
                        <div class="resume-item-title">${escapeHtml(degree)} ${field ? `in ${escapeHtml(field)}` : ''}</div>
                        <div class="resume-item-subtitle">${escapeHtml(institution)}</div>
                    </div>
                </div>
                <div class="resume-item-meta">${startDate} - ${endDate}${grade ? ` | Grade: ${escapeHtml(grade)}` : ''}</div>
            </div>`;
        });
        html += '</div>';
    }

    // Certifications
    const certs = Array.from(document.querySelectorAll('.cert-item')).filter(item => {
        return item.querySelector('.cert-name').value;
    });
    if (certs.length > 0) {
        html += '<div class="resume-section"><div class="resume-section-title">Certifications & Achievements</div>';
        certs.forEach(cert => {
            const name = cert.querySelector('.cert-name').value;
            const issuer = cert.querySelector('.cert-issuer').value;
            const date = formatDate(cert.querySelector('.cert-date').value);

            html += `<div class="resume-item">
                <div class="resume-item-title">${escapeHtml(name)}</div>
                ${issuer ? `<div class="resume-item-subtitle">${escapeHtml(issuer)}</div>` : ''}
                ${date ? `<div class="resume-item-meta">${date}</div>` : ''}
            </div>`;
        });
        html += '</div>';
    }

    // Links
    const links = Array.from(document.querySelectorAll('.link-item')).filter(item => {
        return item.querySelector('.link-url').value;
    });
    if (links.length > 0) {
        html += '<div class="resume-section"><div class="resume-section-title">Links</div><div class="resume-links">';
        links.forEach(link => {
            const label = link.querySelector('.link-label').value || 'Link';
            const url = link.querySelector('.link-url').value;
            html += `<div><a href="${escapeHtml(url)}" target="_blank">${escapeHtml(label)}</a></div>`;
        });
        html += '</div></div>';
    }

    previewDiv.innerHTML = html;
    updateMobilePreview();
}

function updateTemplate() {
    const template = document.getElementById('template-style').value;
    const previewDiv = document.getElementById('resume-preview');
    
    // Remove all template classes
    previewDiv.className = 'resume-preview ' + template;
    updatePreview();
}

function updateThemeColor() {
    const color = document.getElementById('theme-color').value;
    const previewDiv = document.getElementById('resume-preview');
    const root = document.documentElement;
    
    root.style.setProperty('--theme-color', color);
    updatePreview();
}

function updateMobilePreview() {
    const modalPreview = document.querySelector('.modal-resume-preview');
    if (modalPreview) {
        modalPreview.innerHTML = document.getElementById('resume-preview').innerHTML;
        const clonedPreview = modalPreview.querySelector('.resume-preview');
        if (clonedPreview) {
            clonedPreview.className = document.getElementById('resume-preview').className;
        }
    }
}

function showMobilePreview(e) {
    e.preventDefault();
    const previewModal = document.getElementById('preview-modal');
    previewModal.classList.add('active');
    updateMobilePreview();
}

function closeMobilePreview() {
    const previewModal = document.getElementById('preview-modal');
    previewModal.classList.remove('active');
}

function formatDate(dateString) {
    if (!dateString) return '';
    const [year, month] = dateString.split('-');
    const date = new Date(year, month - 1);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
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

function downloadPDF() {
    const element = document.getElementById('resume-preview');
    const opt = {
        margin: 10,
        filename: 'resume.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    // Check if html2pdf is available
    if (typeof html2pdf === 'undefined') {
        alert('Please ensure html2pdf library is loaded. Add this to your HTML: <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>');
        return;
    }

    html2pdf().set(opt).from(element).save();
}

function downloadImage() {
    const element = document.getElementById('resume-preview');
    
    if (typeof html2canvas === 'undefined') {
        alert('Please ensure html2canvas library is loaded. Add this to your HTML: <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>');
        return;
    }

    html2canvas(element, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true
    }).then(canvas => {
        const link = document.createElement('a');
        link.href = canvas.toDataURL('image/png');
        link.download = 'resume.png';
        link.click();
    });
}

function printResume() {
    const element = document.getElementById('resume-preview');
    const printWindow = window.open('', '', 'height=600,width=800');
    
    const styles = `
        <style>
            body { margin: 0; padding: 20px; }
            .resume-preview { 
                width: 210mm; 
                height: 297mm; 
                padding: 40px; 
                margin: 0 auto;
                background: white;
                font-family: 'Segoe UI', sans-serif;
            }
            @media print {
                body { margin: 0; padding: 0; }
                .resume-preview { margin: 0; box-shadow: none; }
            }
        </style>
    `;
    
    printWindow.document.write(styles);
    printWindow.document.write(element.outerHTML);
    printWindow.document.close();
    
    setTimeout(() => {
        printWindow.print();
    }, 250);
}

// Load necessary libraries for PDF and Image export
function loadExportLibraries() {
    // Load html2pdf
    const html2pdfScript = document.createElement('script');
    html2pdfScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
    document.head.appendChild(html2pdfScript);

    // Load html2canvas
    const html2canvasScript = document.createElement('script');
    html2canvasScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
    document.head.appendChild(html2canvasScript);
}

// Load libraries when page loads
window.addEventListener('load', loadExportLibraries);
