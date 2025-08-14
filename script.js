// ==================== FIREBASE INIT ====================
// Declare the firebase variable before using it
const firebase = window.firebase
// Tambahan: pastikan lucide tersedia secara global
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
      auth.signOut()
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
      if (typeof lucide !== "undefined") {
        lucide.createIcons()
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
        const shortDesc = activity.content
          ? activity.content.replace(/<\/?[^>]+(>|$)/g, "").slice(0, 120) + "..."
          : ""

        return `
          <div class="activity-card" data-id="${activity.id}">
            <div class="activity-image">
              ${activity.imageBase64 || activity.imageUrl
                ? `<img src="${activity.imageBase64 || activity.imageUrl}" alt="${activity.title}" loading="lazy">`
                : ""}
              <div class="date-badge">
                <i data-lucide="calendar"></i>
                ${activity.date
                  ? new Date(activity.date).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })
                  : ""}
              </div>
            </div>
            <div class="activity-content">
              <h3>${activity.title || "Tanpa Judul"}</h3>
              <div class="activity-description">${shortDesc}</div>
              <div class="activity-footer">
                <span><i data-lucide="eye"></i> ${activity.views || 0} dilihat</span>
                <a href="#" class="read-more" data-id="${activity.id}">Baca Selengkapnya</a>
              </div>
            </div>
          </div>
        `
      })
      .join("")

    if (typeof lucide !== "undefined") {
      lucide.createIcons()
    }

    // Tambahan: Event listener untuk klik "Baca Selengkapnya"
    container.querySelectorAll(".read-more").forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault()
        const activityId = link.getAttribute("data-id")
        incrementViews(activityId, () => {
          window.location.href = `detail.html?id=${activityId}`
        })
      })
    })
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

  db.ref(`activities/${activityId}`).once("value").then((snapshot) => {
    const activity = snapshot.val()
    if (!activity) {
      detailContainer.innerHTML = "<p>Kegiatan tidak ditemukan.</p>"
      return
    }

    detailContainer.innerHTML = `
      <div class="detail-card">
        <h1 class="detail-title">${activity.title || "Tanpa Judul"}</h1>
        <p class="detail-date"><i data-lucide="calendar"></i> ${
          activity.date
            ? new Date(activity.date).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })
            : ""
        }</p>
        ${activity.imageBase64 || activity.imageUrl
          ? `<img src="${activity.imageBase64 || activity.imageUrl}" alt="${activity.title}" class="detail-image">`
          : ""}
        <div class="detail-content">
          ${activity.content || ""}
        </div>
        <p class="detail-views"><i data-lucide="eye"></i> ${activity.views || 0} kali dilihat</p>
      </div>
    `
    if (typeof lucide !== "undefined") {
      lucide.createIcons()
    }
  })
}

// Perubahan: incrementViews bisa pakai callback
function incrementViews(activityId, callback = null) {
  db.ref(`activities/${activityId}`)
    .transaction((activity) => {
      if (activity) activity.views = (activity.views || 0) + 1
      return activity
    })
    .then(() => {
      if (callback) callback()
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
  const navLinks = document.querySelectorAll('.navbar-links a[href^="#"]')
  navLinks.forEach((link) => {
    link.addEventListener("click", function (e) {
      e.preventDefault()
      const targetId = this.getAttribute("href")
      const targetSection = document.querySelector(targetId)

      if (targetSection) {
        const offsetTop = targetSection.offsetTop - 80
        window.scrollTo({
          top: offsetTop,
          behavior: "smooth",
        })

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

  const texts = [
    "SISTEM INFORMASI DESA KARANGHARJA",
    "MEMBANGUN DESA BERSAMA",
    "PELAYANAN UNTUK WARGA",
  ]

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

  const observerOptions = { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible")
        entry.target.style.opacity = "1"
        entry.target.style.transform = "translateY(0)"
      }
    })
  }, observerOptions)

  const timelineItems = document.querySelectorAll(".timeline-item")
  timelineItems.forEach((item, index) => {
    item.style.opacity = "0"
    item.style.transform = "translateY(30px)"
    item.style.transition = `opacity 0.8s ease ${index * 0.1}s, transform 0.8s ease ${index * 0.1}s`
    observer.observe(item)
  })

  const statItems = document.querySelectorAll(".stat-item")
  statItems.forEach((item, index) => {
    item.style.opacity = "0"
    item.style.transform = "translateY(30px)"
    item.style.transition = `opacity 0.8s ease ${index * 0.2}s, transform 0.8s ease ${index * 0.2}s`
    observer.observe(item)
  })

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

  animateNumbers()
}

// ==================== INIT ====================
document.addEventListener("DOMContentLoaded", () => {
  checkAuthState()
  setupLogout()
  setupNavbarToggle()
  setupSmoothScrolling()
  initTypewriter()
  setupSambutanSejarahAnimations()

  if (document.getElementById("activitiesContainer")) {
    loadActivities("activitiesContainer", null, true)
  }
  if (document.getElementById("dashboardStats")) {
    setupDashboardStats()
  }
  if (document.getElementById("activityDetail")) {
    loadActivityDetail()
  }

  if (typeof lucide !== "undefined") {
    lucide.createIcons()
  }
})
