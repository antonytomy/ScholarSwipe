const userData = {
    major: "Engineering",
    gpa: 3.8,
    year: "Undergrad",
    location: "PA",
    saved: [],
    applied: []
};

const scholarships = [
    {
        id: 1, title: "Future Engineers Grant", amount: "$12,500",
        link: "https://www.nsf.gov/funding/education.jsp",
        desc: "Supporting the next wave of technical innovators in the STEM sector.",
        tags: ["STEM", "Full-Time", "Renewable"],
        gradient: "linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)",
        pitch: "Your Engineering background makes you a strong candidate for this multi-year technical grant.",
        requirements: "Must be enrolled full-time in an ABET-accredited engineering program with a minimum 3.0 GPA. Demonstrate leadership in technical projects or research.",
        deadline: "March 31, 2026",
        reqs: { gpa: 3.0, major: "Engineering", year: "Undergrad", location: "USA" }
    },
    {
        id: 2, title: "Global Tech Innovators", amount: "$8,000",
        link: "https://www.ieee.org/membership/students/scholarships.html",
        desc: "For students demonstrating exceptional promise in software and systems.",
        tags: ["Software", "Innovation"],
        gradient: "linear-gradient(135deg, #312e81 0%, #4338ca 100%)",
        pitch: "This scholarship targets STEM students with high academic standing like yourself.",
        requirements: "Open to students pursuing software engineering, computer science, or related fields. Minimum 3.5 GPA required with demonstrated innovation through projects or research.",
        deadline: "April 20, 2026",
        reqs: { gpa: 3.5, major: "Engineering", year: "Undergrad", location: "Global" }
    },
    {
        id: 3, title: "Keystone State STEM", amount: "$5,000",
        link: "https://www.pheaa.org/funding-opportunities/state-grant-program/",
        desc: "Exclusively for technical students pursuing degrees within Pennsylvania.",
        tags: ["Regional", "One-Time"],
        gradient: "linear-gradient(135deg, #064e3b 0%, #10b981 100%)",
        pitch: "As a student based in Pennsylvania, you meet the primary residency criteria for this award.",
        requirements: "Must be a Pennsylvania resident enrolled in a STEM program at an accredited PA institution. Minimum 3.2 GPA and demonstrated financial need required.",
        deadline: "March 15, 2026",
        reqs: { gpa: 3.2, major: "Engineering", year: "Undergrad", location: "PA" }
    },
    {
        id: 4, title: "'Outstanding Undergraduate' Essay Scholarship", amount: "$1,000",
        link: "https://scholarships360.org/scholarships/search/outstanding-undergraduate-college-scholarship/",
        desc: "With the $1,000 “Outstanding Undergraduate” Essay Scholarship, we aim to help out a lucky undergraduate student who is passionate about their higher education journey and actively looking for ways to fund it.",
        tags: ["Diversity", "Leadership"],
        gradient: "linear-gradient(135deg, #701a75 0%, #d946ef 100%)",
        pitch: "Your profile aligns with the leadership and academic excellence required for this grant.",
        requirements: "High School Seniors & College Students + U.S. Citizens, Permanent Residents",
        deadline: "November 30, 2026",
        reqs: { gpa: 3.4, major: "Any", year: "Highschool/Undergrad", location: "USA" }
    }
];

function render() {
    const feed = document.getElementById('feedContainer');
    feed.innerHTML = scholarships.map(s => {
        const results = [
            { label: "GPA Min: " + s.reqs.gpa, pass: userData.gpa >= s.reqs.gpa },
            { label: "Major: " + s.reqs.major, pass: userData.major === s.reqs.major },
            { label: "Level: " + s.reqs.year, pass: userData.year === s.reqs.year },
            { label: "Region: " + s.reqs.location, pass: s.reqs.location === "USA" || s.reqs.location === "Global" || userData.location === s.reqs.location }
        ];
        const score = Math.round((results.filter(r => r.pass).length / results.length) * 100);
        const isSaved = userData.saved.includes(s.id);

        return `
            <div class="feed-item">
                <div class="tiktok-card" style="background: ${s.gradient}">
                    <div class="card-overlay">
                        <div class="tag-row">${s.tags.map(t => `<span class="tag">${t}</span>`).join('')}</div>
                        <div class="amount">${s.amount}</div>
                        <h2 style="font-size:28px; margin-bottom:8px;">${s.title}</h2>
                        <p style="font-size:15px; opacity:0.85; margin-bottom: 24px;">${s.desc}</p>
                        
                        <div style="margin-bottom: 24px; padding-bottom: 24px; border-bottom: 1px solid rgba(255,255,255,0.1);">
                            <p style="font-size: 11px; text-transform: uppercase; letter-spacing: 2px; opacity: 0.7; margin-bottom: 8px;">FULL REQUIREMENTS</p>
                            <p style="font-size: 14px; line-height: 1.6; opacity: 0.9;">${s.requirements}</p>
                        </div>
                        
                        <div style="margin-bottom: 24px;">
                            <p style="font-size: 11px; text-transform: uppercase; letter-spacing: 2px; opacity: 0.7; margin-bottom: 8px;">APPLICATION DEADLINE</p>
                            <p style="font-size: 18px;">${s.deadline}</p>
                        </div>
                        
                        <div class="action-bar">
                            <button class="btn-circle ${isSaved ? 'saved' : ''}" onclick="toggleSave(${s.id})">
                                <i class="${isSaved ? 'fas' : 'far'} fa-bookmark"></i>
                            </button>
                            <button class="btn-circle" onclick="shareScholarship('${s.title}')">
                                <i class="fas fa-paper-plane"></i>
                            </button>
                            <button class="btn-apply ${userData.applied.includes(s.id) ? 'applied' : ''}" onclick="applyScholarship(${s.id}, '${s.link}')">${userData.applied.includes(s.id) ? '<i class="fas fa-check"></i> Applied' : 'Apply Now'}</button>
                        </div>
                    </div>
                </div>
                <div class="match-panel">
                    <div class="score-pill">${score}% Match</div>
                    <div class="why-box">
                        <div class="why-header">
                            <div class="why-icon-wrapper">
                                <i class="fas fa-puzzle-piece"></i>
                            </div>
                            <span>Why this fits:</span>
                        </div>
                        <p>${s.pitch}</p>
                    </div>
                    <div class="checklist">
                        ${results.map(r => `
                            <div class="check-item">
                                <span>${r.label}</span>
                                <span class="status-tag ${r.pass ? 'match' : 'miss'}">${r.pass ? 'ELIGIBLE' : 'NOT MET'}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>`;
    }).join('');
}

// Saved Overlays Logic
const savedOverlay = document.getElementById('savedOverlay');
const savedGrid = document.getElementById('savedGrid');

function renderSavedItems() {
    const savedList = scholarships.filter(s => userData.saved.includes(s.id));
    if (savedList.length === 0) {
        savedGrid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 100px; opacity: 0.5;">
            <i class="fas fa-bookmark fa-3x" style="margin-bottom: 20px;"></i>
            <h3>No scholarships saved yet.</h3>
        </div>`;
        return;
    }
    savedGrid.innerHTML = savedList.map(s => `
        <div class="saved-card">
            <button class="remove-btn" onclick="toggleSave(${s.id}); renderSavedItems();">
                <i class="fas fa-trash-alt"></i>
            </button>
            <div class="amount" style="font-size:24px; font-weight:800; color:var(--navy); margin-bottom:10px;">${s.amount}</div>
            <h3 style="margin-bottom:15px; font-size:18px;">${s.title}</h3>
            <button class="btn-apply" style="width:100%; padding:12px; font-size:14px;">Finish App</button>
        </div>
    `).join('');
}

document.getElementById('savedTab').onclick = (e) => { e.preventDefault(); renderSavedItems(); savedOverlay.classList.add('show'); appliedOverlay.classList.remove('show'); };
document.getElementById('discoverTab').onclick = (e) => { e.preventDefault(); savedOverlay.classList.remove('show'); appliedOverlay.classList.remove('show'); };
document.getElementById('closeSaved').onclick = () => savedOverlay.classList.remove('show');

// Applied Overlay Logic
const appliedOverlay = document.getElementById('appliedOverlay');
const appliedGrid = document.getElementById('appliedGrid');

function renderAppliedItems() {
    const appliedList = scholarships.filter(s => userData.applied.includes(s.id));
    if (appliedList.length === 0) {
        appliedGrid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 100px; opacity: 0.5;">
            <i class="fas fa-check-circle fa-3x" style="margin-bottom: 20px;"></i>
            <h3>No applications yet.</h3>
        </div>`;
        return;
    }
    appliedGrid.innerHTML = appliedList.map(s => `
        <div class="saved-card">
            <button class="remove-btn" onclick="removeApplied(${s.id})">
                <i class="fas fa-trash-alt"></i>
            </button>
            <div style="position:absolute; top:16px; right:56px; background:#d1fae5; color:#065f46; padding:4px 12px; border-radius:12px; font-size:11px; font-weight:700; text-transform:uppercase;">Applied</div>
            <div class="amount" style="font-size:24px; font-weight:800; color:var(--navy); margin-bottom:10px;">${s.amount}</div>
            <h3 style="margin-bottom:8px; font-size:18px;">${s.title}</h3>
            <p style="font-size:13px; opacity:0.6; margin-bottom:15px;">Deadline: ${s.deadline}</p>
            <button class="btn-apply" style="width:100%; padding:12px; font-size:14px;" onclick="window.open('${s.link}', '_blank')">Continue Application</button>
        </div>
    `).join('');
}

window.removeApplied = (id) => {
    const idx = userData.applied.indexOf(id);
    if (idx > -1) userData.applied.splice(idx, 1);
    document.getElementById('appliedCount').innerText = userData.applied.length;
    renderAppliedItems();
    render();
};

document.getElementById('appliedTab').onclick = (e) => { e.preventDefault(); renderAppliedItems(); appliedOverlay.classList.add('show'); savedOverlay.classList.remove('show'); };
document.getElementById('closeApplied').onclick = () => appliedOverlay.classList.remove('show');

// Settings & Themes
const settingsBtn = document.getElementById('settingsBtn');
const settingsMenu = document.getElementById('settingsMenu');
settingsBtn.onclick = (e) => { e.stopPropagation(); settingsMenu.classList.toggle('show'); };
document.onclick = () => settingsMenu.classList.remove('show');

document.getElementById('themeToggle').onclick = () => {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    document.getElementById('themeToggle').innerHTML = isDark ? '<i class="fas fa-sun"></i> Light Mode' : '<i class="fas fa-moon"></i> Dark Mode';
};

// Actions
window.toggleSave = (id) => {
    const idx = userData.saved.indexOf(id);
    if (idx > -1) userData.saved.splice(idx, 1);
    else userData.saved.push(id);
    document.getElementById('savedCount').innerText = userData.saved.length;
    render();
};

window.shareScholarship = (title) => {
    navigator.clipboard.writeText(`Apply for ${title} on ScholarSwipe!`);
    const toast = document.getElementById('toast');
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2000);
};

window.applyScholarship = (id, link) => {
    if (!userData.applied.includes(id)) {
        userData.applied.push(id);
        document.getElementById('appliedCount').innerText = userData.applied.length;
    }
    window.open(link, '_blank');
    render();
};

// Animated Space Navigation
let hasScrolled = false;
document.addEventListener('keydown', e => {
    if (e.code === 'Space') {
        e.preventDefault();
        document.getElementById('feedContainer').scrollBy({ top: window.innerHeight, behavior: 'smooth' });
        if (!hasScrolled) {
            const hint = document.getElementById('navHint');
            hint.classList.add('hint-hidden');
            setTimeout(() => hint.style.display = 'none', 800);
            hasScrolled = true;
        }
    }
});

render();
