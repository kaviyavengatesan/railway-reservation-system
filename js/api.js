const API_BASE_URL = 'http://localhost:5000/api';

const api = {
  // Utility for standard requests
  async request(endpoint, options = {}) {
    const token = localStorage.getItem('token');
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'API request failed');
      }
      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },

  // Auth Group
  auth: {
    login: (email, password) => api.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    }),
    register: (name, email, password, role) => api.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, role })
    })
  },

  // Train Group
  trains: {
    getAll: (source = '', destination = '') => {
      const query = new URLSearchParams();
      if (source) query.append('source', source);
      if (destination) query.append('destination', destination);
      return api.request(`/trains?${query.toString()}`);
    },
    create: (trainData) => api.request('/trains', {
      method: 'POST',
      body: JSON.stringify(trainData)
    }),
    update: (id, trainData) => api.request(`/trains/${id}`, {
      method: 'PUT',
      body: JSON.stringify(trainData)
    }),
    delete: (id) => api.request(`/trains/${id}`, {
      method: 'DELETE'
    }),
    getBookedSeats: (id, date) => api.request(`/trains/${id}/seats?date=${date}`)
  },

  // Booking Group
  bookings: {
    create: (bookingData) => api.request('/bookings', {
      method: 'POST',
      body: JSON.stringify(bookingData)
    }),
    getByPNR: (pnr) => api.request(`/bookings/${pnr}`),
    getMyBookings: () => api.request('/bookings/my'),
    cancel: (pnr, passengerIds = []) => api.request(`/bookings/${pnr}/cancel`, {
      method: 'PUT',
      body: JSON.stringify({ passengerIds })
    })
  }
};

window.api = api;

// Global Toast Notification
window.showToast = (message, isError = false) => {
  const toast = document.getElementById('toast');
  if(!toast) return;
  toast.innerText = message;
  toast.style.background = isError ? 'var(--accent-color)' : '#10B981';
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
};

// Global Auth Check
window.checkAuth = () => {
  const user = JSON.parse(localStorage.getItem('user'));
  const authLink = document.getElementById('auth-link');
  if (user && authLink) {
    if (user.role === 'admin') {
      authLink.innerHTML = `<a href="admin.html" class="btn-nav">Admin Dashboard</a> <a href="#" onclick="window.logout()" style="margin-left:1rem; color:var(--text-light)">Logout</a>`;
    } else {
      authLink.innerHTML = `<a href="profile.html" style="color:var(--text-light); margin-right: 1rem; text-decoration: none; font-weight: 600;">👋 Hi, ${user.name}</a> <a href="#" onclick="window.logout()" class="btn-nav">Logout</a>`;
    }
  } else if (!user && authLink) {
    // Ensuring it renders fine when logging out
    authLink.innerHTML = `
      <a href="login.html" class="btn-nav" style="background:transparent; border: 1px solid var(--text-light); margin-right: 0.5rem;">Login</a>
      <a href="login.html?action=register" class="btn-nav">Register</a>
    `;
  }
};

window.logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = 'login.html';
};

document.addEventListener('DOMContentLoaded', () => {
  if(window.checkAuth) window.checkAuth();
});
