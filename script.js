// ==================== FIREBASE INIT ====================
const firebaseConfig = {
  apiKey: "AIzaSyC0AcdsPrAQxttVk1SBfBcZnF6tYg4y6GM",
  authDomain: "desakarangharja-31525.firebaseapp.com",
  databaseURL: "https://desakarangharja-31525-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "desakarangharja-31525",
  storageBucket: "desakarangharja-31525.firebasestorage.app",
  messagingSenderId: "428460519406",
  appId: "1:428460519406:web:fca8b9854de78cac5628ff"
};

const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.database();
const storage = firebase.storage();

// ==================== AUTH ====================
function checkAuthState() {
  auth.onAuthStateChanged(user => {
    const restrictedPages = ['dashboard.html', 'kegiatan.html'];
    if (!user || user.email !== "karangharja2025@gmail.com") {
      if (restrictedPages.some(page => window.location.pathname.includes(page))) {
        window.location.href = "login.html";
      }
    } else if (window.location.pathname.includes('login.html')) {
      window.location.href = "dashboard.html";
    }
  });
}

function setupLogout() {
  document.querySelectorAll('.logout, #logoutBtn').forEach(btn => {
    btn.addEventListener('click', () => {
      auth.signOut()
        .then(() => window.location.href = "login.html")
        .catch(err => console.error('Logout error:', err));
    });
  });
}

// ==================== ACTIVITIES ====================
function loadActivities(containerId, limit = null, onlyPublished = false) {
  const container = document.getElementById(containerId);
  if (!container) return;

  let activitiesRef = db.ref('activities');
  if (limit) activitiesRef = activitiesRef.limitToLast(limit);

  activitiesRef.on('value', snapshot => {
    const activities = snapshot.val();
    container.innerHTML = '';

    if (!activities) {
      container.innerHTML = `
        <div class="empty-activities">
          <div class="empty-icon"><i data-lucide="calendar"></i></div>
          <h3 class="empty-title">Belum Ada Kegiatan</h3>
          <p class="empty-subtitle">Kegiatan desa akan ditampilkan di sini</p>
        </div>
      `;
      lucide.createIcons();
      return;
    }

    let processedActivities = Object.entries(activities).map(([id, data]) => ({
      id,
      ...data
    }));

    // Sort by createdAt (fallback ke 0 kalau gak ada)
    processedActivities.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    // Filter hanya published kalau diminta
    if (onlyPublished) {
      processedActivities = processedActivities.filter(act => act.published === true);
    }

    // Build HTML
    container.innerHTML = processedActivities.map(activity => `
      <div class="activity-card" data-id="${activity.id}">
        <div class="activity-image">
          ${activity.imageBase64 || activity.imageUrl ? `<img src="${activity.imageBase64 || activity.imageUrl}" alt="${activity.title}" loading="lazy">` : ''}
          <div class="date-badge">
            <i data-lucide="calendar"></i>
            ${activity.date ? new Date(activity.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
          </div>
        </div>
        <div class="activity-content">
          <h3>${activity.title || 'Tanpa Judul'}</h3>
          <div class="activity-description">${activity.content || ''}</div>
          <div class="activity-footer">
            <span><i data-lucide="eye"></i> ${activity.views || 0} dilihat</span>
          </div>
        </div>
      </div>
    `).join('');

    lucide.createIcons();
    setupActivityClickHandlers();
  });
}

function setupActivityClickHandlers() {
  document.querySelectorAll('.activity-card').forEach(card => {
    card.addEventListener('click', function () {
      const activityId = this.dataset.id;
      incrementViews(activityId);
      // Redirect ke halaman detail kalau ada
      // window.location.href = `detail.html?id=${activityId}`;
    });
  });
}

function incrementViews(activityId) {
  db.ref(`activities/${activityId}`).transaction(activity => {
    if (activity) activity.views = (activity.views || 0) + 1;
    return activity;
  }).catch(err => console.error('Error incrementing views:', err));
}

// ==================== DASHBOARD STATS ====================
function setupDashboardStats() {
  db.ref('activities').on('value', snapshot => {
    const activities = snapshot.val();
    const stats = { total: 0, published: 0, draft: 0, views: 0 };

    if (activities) {
      stats.total = Object.keys(activities).length;
      Object.values(activities).forEach(activity => {
        if (activity.published) stats.published++;
        else stats.draft++;
        stats.views += activity.views || 0;
      });
    }

    document.getElementById('totalActivities').textContent = stats.total;
    document.getElementById('publishedCount').textContent = stats.published;
    document.getElementById('draftCount').textContent = stats.draft;
    document.getElementById('totalViews').textContent = stats.views;
  });
}

// ==================== NAVBAR & SCROLL ====================
function setupNavbarToggle() {
  const navbarToggle = document.getElementById('navbar-toggle');
  const navbarMenu = document.getElementById('navbar-menu');
  
  if (navbarToggle && navbarMenu) {
    navbarToggle.addEventListener('click', e => {
      e.stopPropagation();
      navbarMenu.classList.toggle('active');
      navbarToggle.classList.toggle('active');
    });

    document.addEventListener('click', e => {
      if (!navbarToggle.contains(e.target) && !navbarMenu.contains(e.target)) {
        navbarMenu.classList.remove('active');
        navbarToggle.classList.remove('active');
      }
    });
  }
}

function setupSmoothScrolling() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', e => {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) target.scrollIntoView({ behavior: 'smooth' });
    });
  });
}

// ==================== TYPEWRITER ====================
function initTypewriter() {
  const element = document.getElementById("typewriter-text");
  if (!element) return;
  const text = "SISTEM INFORMASI DESA KARANGHARJA";
  let i = 0;
  element.innerHTML = '';
  (function typeWriter() {
    if (i < text.length) {
      element.innerHTML += text.charAt(i);
      i++;
      setTimeout(typeWriter, 100);
    }
  })();
}

// ==================== INIT ====================
document.addEventListener('DOMContentLoaded', () => {
  checkAuthState();
  setupNavbarToggle();
  setupSmoothScrolling();
  initTypewriter();
  setupLogout();

  if (document.getElementById('activitiesContainer')) {
    loadActivities('activitiesContainer', null, true); // index: hanya published
  }

  if (document.getElementById('dashboardStats')) {
    setupDashboardStats();
  }

  lucide.createIcons();
});
