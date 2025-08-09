document.addEventListener('DOMContentLoaded', function() {
  const toggle = document.getElementById('navbar-toggle');
  const menu = document.getElementById('navbar-menu');
  
  toggle.addEventListener('click', function() {
    menu.classList.toggle('active');
    
    // Animasi hamburger icon
    toggle.classList.toggle('active');
  });
  
  // Tutup menu saat klik di luar
  document.addEventListener('click', function(e) {
    if (!menu.contains(e.target) && !toggle.contains(e.target)) {
      menu.classList.remove('active');
      toggle.classList.remove('active');
    }
  });
});

// Typewriter Effect
function initTypewriter() {
  const text = "SISTEM INFORMASI DESA KARANGHARJA";
  const element = document.getElementById("typewriter-text");
  let displayText = "";
  let isDeleting = false;
  let loopNum = 0;
  let typingSpeed = 150;

  function type() {
    const current = loopNum % 1;
    const fullText = text;

    displayText = isDeleting
      ? fullText.substring(0, displayText.length - 1)
      : fullText.substring(0, displayText.length + 1);

    element.textContent = displayText;
    typingSpeed = isDeleting ? 30 : 150;

    if (!isDeleting && displayText === fullText) {
      setTimeout(() => (isDeleting = true), 2000);
    } else if (isDeleting && displayText === "") {
      isDeleting = false;
      loopNum++;
    }

    setTimeout(type, typingSpeed);
  }

  setTimeout(type, typingSpeed);
}

// Activity Cards Animation
function animateActivityCards() {
  const cards = document.querySelectorAll(".activity-card");
  cards.forEach((card, index) => {
    setTimeout(() => {
      card.classList.remove("hidden");
    }, index * 200);
  });
}

// Mock activities data
const mockActivities = [
  {
    id: 1,
    title: "Gotong Royong Membersihkan Desa",
    content: "Kegiatan gotong royong membersihkan lingkungan desa dari sampah dan dedaunan kering. Diikuti oleh warga dari semua RT.",
    date: "2025-05-15",
    imageUrl: "https://images.unsplash.com/photo-1600880292203-757bb62b4baf",
    views: 124
  },
  {
    id: 2,
    title: "Pelatihan Kewirausahaan",
    content: "Pelatihan kewirausahaan untuk pemuda desa dengan materi pengolahan hasil pertanian menjadi produk bernilai tinggi.",
    date: "2025-06-02",
    imageUrl: "https://images.unsplash.com/photo-1552664730-d307ca884978",
    views: 89
  },
  {
    id: 3,
    title: "Peringatan HUT RI ke-80",
    content: "Berbagai lomba dan acara meriah dalam rangka memperingati Hari Kemerdekaan Republik Indonesia ke-80.",
    date: "2025-08-17",
    imageUrl: "https://images.unsplash.com/photo-1519817650390-64a93db51149",
    views: 215
  }
];

// Render Activities
function renderActivities() {
  const container = document.getElementById("activities-container");
  
  if (mockActivities.length === 0) {
    container.innerHTML = `
      <div class="empty-activities">
        <div class="empty-icon">
          <i data-lucide="calendar" class="empty-calendar"></i>
        </div>
        <h3>Belum Ada Kegiatan</h3>
        <p>Kegiatan desa akan ditampilkan di sini</p>
      </div>
    `;
    return;
  }

  container.innerHTML = mockActivities.map((activity, index) => `
    <div class="activity-card hidden" style="transition-delay: ${index * 0.2}s">
      <div class="activity-card-inner">
        <div class="activity-image">
          <img src="${activity.imageUrl}" alt="${activity.title}">
          <div class="image-overlay"></div>
          <div class="date-badge">
            <i data-lucide="calendar"></i>
            ${new Date(activity.date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
          </div>
          <div class="sparkle-icon">
            <i data-lucide="sparkles"></i>
          </div>
        </div>
        <div class="activity-content">
          <h3 class="activity-title">${activity.title}</h3>
          <div class="activity-description">
            ${activity.content}
          </div>
          <div class="description-overlay"></div>
          <div class="activity-footer">
            <div class="activity-date">
              <span>${new Date(activity.date).toLocaleDateString("id-ID")}</span>
            </div>
            <button class="read-more-btn">
              <span>Baca Selengkapnya</span>
              <i data-lucide="arrow-right"></i>
            </button>
                      </div>
        </div>
      </div>
    </div>
  `).join('');

  // Animate cards after rendering
  setTimeout(animateActivityCards, 100);
  
  // Add event listeners to activity cards
  document.querySelectorAll('.activity-card-inner').forEach(card => {
    card.addEventListener('mouseenter', function() {
      this.querySelector('.sparkle-icon').style.opacity = '1';
      this.querySelector('.image-overlay').style.opacity = '1';
      this.querySelector('.description-overlay').style.opacity = '0';
    });
    
    card.addEventListener('mouseleave', function() {
      this.querySelector('.sparkle-icon').style.opacity = '0';
      this.querySelector('.image-overlay').style.opacity = '0';
      this.querySelector('.description-overlay').style.opacity = '1';
    });
    
    card.addEventListener('click', function() {
      // Increment views (simulated)
      const activityId = this.closest('.activity-card').dataset.id;
      console.log(`Activity ${activityId} clicked - incrementing views`);
      // In a real app, you would make an API call here
    });
  });
}

// Increment Views Function
function incrementViews(activityId) {
  console.log(`Incrementing views for activity ${activityId}`);
  // In a real app, you would make an API call here
}

// Smooth Scrolling for Navigation
function initSmoothScrolling() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      e.preventDefault();
      const targetId = this.getAttribute('href');
      const targetElement = document.querySelector(targetId);
      
      if (targetElement) {
        targetElement.scrollIntoView({
          behavior: 'smooth'
        });
      }
    });
  });
}

// Intersection Observer for Scroll Animations
function initScrollAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animate-fadeIn');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.1
  });

  document.querySelectorAll('.section-header, .org-node, .activity-card').forEach(el => {
    observer.observe(el);
  });
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  // Initialize all components
  initTypewriter();
  renderActivities();
  initSmoothScrolling();
  initScrollAnimations();
  
  // Refresh Lucide icons after dynamic content is loaded
  setTimeout(() => {
    lucide.createIcons();
  }, 500);
});

// Add CSS for animations
const style = document.createElement('style');
style.textContent = `
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .animate-fadeIn {
    animation: fadeIn 0.8s ease-out forwards;
  }
  .activity-card {
    opacity: 0;
    transform: translateY(20px);
  }
  .activity-card.visible {
    opacity: 1;
    transform: translateY(0);
  }
`;
document.head.appendChild(style);
