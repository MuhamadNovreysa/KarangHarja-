// ==================== FIREBASE INIT ====================
// Declare the firebase variable before using it
const firebase = window.firebase
// Tambahan: pastikan lucide tersedia secara global (tidak menghapus deklarasi lucide lain di bawah)
const lucide = window.lucide || undefined

const firebaseConfig = {
  apiKey: "AIzaSyC0AcdsPrAQxttVk1SBfBcZnF6tYg4y6GM",
  authDomain: "desakarangharja-31525.firebaseapp.com",
  databaseURL: "https://desakarangharja-31525-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "desakarangharja-31525",
  storageBucket: "desakarangharja-31525.firebasestorage.app",
  messagingSenderId: "428460519406",
  appId: "1:428460519406:web:fca8b9854de78cac5628ff",
}

const app = firebase.initializeApp(firebaseConfig)
const auth = firebase.auth()
const db = firebase.database()
const storage = firebase.storage()

// ==================== AUTH ====================
function checkAuthState() {
  auth.onAuthStateChanged((user) => {
    const restrictedPages = ["dashboard.html", "kegiatan.html"]
    if (!user || user.email !== "karangharja2025@gmail.com") {
      if (restrictedPages.some((page) => window.location.pathname.includes(page))) {
        window.location.href = "login.html"
      }
    } else if (window.location.pathname.includes("login.html")) {
      window.location.href = "dashboard.html"
    }
  })
}

function setupLogout() {
  document.querySelectorAll(".logout, #logoutBtn").forEach((btn) => {
    btn.addEventListener("click", () => {
      auth
        .signOut()
        .then(() => (window.location.href = "login.html"))
        .catch((err) => console.error("Logout error:", err))
    })
  })
}

// ==================== ACTIVITIES (INDEX) ====================
function loadActivities(containerId, limit = null, onlyPublished = false) {
  const container = document.getElementById(containerId)
  if (!container) return

  let activitiesRef = db.ref("activities")
  if (limit) activitiesRef = activitiesRef.limitToLast(limit)

  activitiesRef.on("value", (snapshot) => {
    const activities = snapshot.val()
    container.innerHTML = ""

    if (!activities) {
      container.innerHTML = `
        <div class="empty-activities">
          <div class="empty-icon"><i data-lucide="calendar"></i></div>
          <h3 class="empty-title">Belum Ada Kegiatan</h3>
          <p class="empty-subtitle">Kegiatan desa akan ditampilkan di sini</p>
        </div>
      `
      // Declare the lucide variable before using it
      const lucide = window.lucide
      if (typeof lucide !== "undefined") {
        lucide.createIcons()
      } else {
        console.warn("Lucide icons not loaded")
      }
      return
    }

    let processedActivities = Object.entries(activities).map(([id, data]) => ({
      id,
      ...data,
    }))

    processedActivities.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))

    if (onlyPublished) {
      processedActivities = processedActivities.filter((act) => act.published === true)
    }

    container.innerHTML = processedActivities
      .map((activity) => {
        const shortDesc = activity.content ? activity.content.replace(/<\/?[^>]+(>|$)/g, "").slice(0, 120) + "..." : ""

        return `
        <div class="activity-card" data-id="${activity.id}">
          <div class="activity-image">
            ${
              activity.imageBase64 || activity.imageUrl
                ? `<img src="${activity.imageBase64 || activity.imageUrl}" alt="${activity.title}" loading="lazy">`
                : ""
            }
            <div class="date-badge">
              <i data-lucide="calendar"></i>
              ${
                activity.date
                  ? new Date(activity.date).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })
                  : ""
              }
            </div>
          </div>
          <div class="activity-content">
            <h3>${activity.title || "Tanpa Judul"}</h3>
            <div class="activity-description">${shortDesc}</div>
            <div class="activity-footer">
              <span><i data-lucide="eye"></i> ${activity.views || 0} dilihat</span>
              <a href="detail.html?id=${activity.id}" class="read-more">Baca Selengkapnya</a>
            </div>
          </div>
        </div>
      `
      })
      .join("")

    // Declare the lucide variable before using it
    const lucide = window.lucide
    if (typeof lucide !== "undefined") {
      lucide.createIcons()
    } else {
      console.warn("Lucide icons not loaded")
    }
  })
}

// ==================== DETAIL PAGE ====================
function loadActivityDetail() {
  const detailContainer = document.getElementById("activityDetail")
  if (!detailContainer) return

  const params = new URLSearchParams(window.location.search)
  const activityId = params.get("id")

  if (!activityId) {
    detailContainer.innerHTML = "<p>Data kegiatan tidak ditemukan.</p>"
    return
  }

  db.ref(`activities/${activityId}`)
    .once("value")
    .then((snapshot) => {
      const activity = snapshot.val()
      if (!activity) {
        detailContainer.innerHTML = "<p>Kegiatan tidak ditemukan.</p>"
        return
      }

      // Increment view count
      incrementViews(activityId)

      detailContainer.innerHTML = `
      <div class="detail-card">
        <h1 class="detail-title">${activity.title || "Tanpa Judul"}</h1>
        <p class="detail-date"><i data-lucide="calendar"></i> ${
          activity.date
            ? new Date(activity.date).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })
            : ""
        }</p>
        ${
          activity.imageBase64 || activity.imageUrl
            ? `<img src="${activity.imageBase64 || activity.imageUrl}" alt="${activity.title}" class="detail-image">`
            : ""
        }
        <div class="detail-content">
          ${activity.content || ""}
        </div>
        <p class="detail-views"><i data-lucide="eye"></i> ${activity.views || 0} kali dilihat</p>
      </div>
    `
      // Declare the lucide variable before using it
      const lucide = window.lucide
      if (typeof lucide !== "undefined") {
        lucide.createIcons()
      } else {
        console.warn("Lucide icons not loaded")
      }
    })
}

function incrementViews(activityId) {
  db.ref(`activities/${activityId}`)
    .transaction((activity) => {
      if (activity) activity.views = (activity.views || 0) + 1
      return activity
    })
    .catch((err) => console.error("Error incrementing views:", err))
}

// ==================== DASHBOARD STATS ====================
function setupDashboardStats() {
  db.ref("activities").on("value", (snapshot) => {
    const activities = snapshot.val()
    const stats = { total: 0, published: 0, draft: 0, views: 0 }

    if (activities) {
      stats.total = Object.keys(activities).length
      Object.values(activities).forEach((activity) => {
        if (activity.published) stats.published++
        else stats.draft++
        stats.views += activity.views || 0
      })
    }

    const totalElement = document.getElementById("totalActivities")
    const publishedElement = document.getElementById("publishedCount")
    const draftElement = document.getElementById("draftCount")
    const viewsElement = document.getElementById("totalViews")

    if (totalElement) totalElement.textContent = stats.total
    if (publishedElement) publishedElement.textContent = stats.published
    if (draftElement) draftElement.textContent = stats.draft
    if (viewsElement) viewsElement.textContent = stats.views
  })
}

// ==================== NAVBAR & SCROLL ====================
function setupNavbarToggle() {
  const navbarToggle = document.getElementById("navbar-toggle")
  const navbarMenu = document.getElementById("navbar-menu")

  if (navbarToggle && navbarMenu) {
    navbarToggle.addEventListener("click", (e) => {
      e.stopPropagation()
      navbarMenu.classList.toggle("active")
      navbarToggle.classList.toggle("active")
    })

    document.addEventListener("click", (e) => {
      if (!navbarToggle.contains(e.target) && !navbarMenu.contains(e.target)) {
        navbarMenu.classList.remove("active")
        navbarToggle.classList.remove("active")
      }
    })
  }
}

function setupSmoothScrolling() {
  // Smooth scrolling for navigation links
  const navLinks = document.querySelectorAll('.navbar-links a[href^="#"]')

  navLinks.forEach((link) => {
    link.addEventListener("click", function (e) {
      e.preventDefault()

      const targetId = this.getAttribute("href")
      const targetSection = document.querySelector(targetId)

      if (targetSection) {
        const offsetTop = targetSection.offsetTop - 80 // Account for fixed navbar

        window.scrollTo({
          top: offsetTop,
          behavior: "smooth",
        })

        // Close mobile menu if open
        const navbarMenu = document.getElementById("navbar-menu")
        const navbarToggle = document.getElementById("navbar-toggle")
        if (navbarMenu && navbarMenu.classList.contains("active")) {
          navbarMenu.classList.remove("active")
          if (navbarToggle) navbarToggle.classList.remove("active")
        }
      }
    })
  })
}

// ==================== TYPEWRITER ====================
function initTypewriter() {
  const element = document.getElementById("typewriter-text")
  if (!element) return

  const texts = ["SISTEM INFORMASI DESA KARANGHARJA", "MEMBANGUN DESA BERSAMA", "PELAYANAN UNTUK WARGA"]

  let textIndex = 0
  let charIndex = 0
  let isDeleting = false
  const typingSpeed = 100
  const deletingSpeed = 50
  const delayBetween = 1500

  function type() {
    const currentText = texts[textIndex]

    if (isDeleting) {
      element.textContent = currentText.substring(0, charIndex - 1)
      charIndex--
    } else {
      element.textContent = currentText.substring(0, charIndex + 1)
      charIndex++
    }

    let timeout = isDeleting ? deletingSpeed : typingSpeed

    if (!isDeleting && charIndex === currentText.length) {
      timeout = delayBetween
      isDeleting = true
    } else if (isDeleting && charIndex === 0) {
      isDeleting = false
      textIndex = (textIndex + 1) % texts.length
      timeout = typingSpeed
    }

    setTimeout(type, timeout)
  }

  type()
}

// ==================== SAMBUTAN & SEJARAH ANIMATIONS ====================
function setupSambutanSejarahAnimations() {
  // Active navigation highlighting
  window.addEventListener("scroll", () => {
    const sections = document.querySelectorAll("section[id]")
    const navLinks = document.querySelectorAll('.navbar-links a[href^="#"]')

    let current = ""

    sections.forEach((section) => {
      const sectionTop = section.offsetTop - 120
      const sectionHeight = section.offsetHeight

      if (window.pageYOffset >= sectionTop && window.pageYOffset < sectionTop + sectionHeight) {
        current = section.getAttribute("id")
      }
    })

    navLinks.forEach((link) => {
      link.classList.remove("active")
      if (link.getAttribute("href") === "#" + current) {
        link.classList.add("active")
      }
    })
  })

  // Enhanced intersection observer for animations
  const observerOptions = {
    threshold: 0.1,
    rootMargin: "0px 0px -50px 0px",
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible")
        entry.target.style.opacity = "1"
        entry.target.style.transform = "translateY(0)"
      }
    })
  }, observerOptions)

  // Observe timeline items with staggered animation
  const timelineItems = document.querySelectorAll(".timeline-item")
  timelineItems.forEach((item, index) => {
    item.style.opacity = "0"
    item.style.transform = "translateY(30px)"
    item.style.transition = `opacity 0.8s ease ${index * 0.1}s, transform 0.8s ease ${index * 0.1}s`
    observer.observe(item)
  })

  // Observe stats items with staggered animation
  const statItems = document.querySelectorAll(".stat-item")
  statItems.forEach((item, index) => {
    item.style.opacity = "0"
    item.style.transform = "translateY(30px)"
    item.style.transition = `opacity 0.8s ease ${index * 0.2}s, transform 0.8s ease ${index * 0.2}s`
    observer.observe(item)
  })

  // Animate numbers in stats
  const animateNumbers = () => {
    const statNumbers = document.querySelectorAll(".stat-number")

    statNumbers.forEach((stat) => {
      const target = Number.parseInt(stat.textContent.replace(/\D/g, ""))
      const suffix = stat.textContent.replace(/\d/g, "")
      let current = 0
      const increment = target / 50

      const updateNumber = () => {
        if (current < target) {
          current += increment
          stat.textContent = Math.floor(current) + suffix
          requestAnimationFrame(updateNumber)
        } else {
          stat.textContent = target + suffix
        }
      }

      // Start animation when stat becomes visible
      const statObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            updateNumber()
            statObserver.unobserve(entry.target)
          }
        })
      })

      statObserver.observe(stat.parentElement)
    })
  }

  // Initialize number animations
  animateNumbers()
}

// ==================== INIT ====================
document.addEventListener("DOMContentLoaded", () => {
  // Firebase and Auth
  checkAuthState()
  setupLogout()

  // Navigation and UI
  setupNavbarToggle()
  setupSmoothScrolling()

  // Animations and Effects
  initTypewriter()
  setupSambutanSejarahAnimations()

  // Firebase Data Loading
  if (document.getElementById("activitiesContainer")) {
    loadActivities("activitiesContainer", null, true)
  }

  if (document.getElementById("dashboardStats")) {
    setupDashboardStats()
  }

  if (document.getElementById("activityDetail")) {
    loadActivityDetail()
  }

  // Initialize Lucide icons
  const lucide = window.lucide
  if (typeof lucide !== "undefined") {
    lucide.createIcons()
  } else {
    console.warn("Lucide icons not loaded")
  }
})
