document.addEventListener('DOMContentLoaded', () => {
  const searchForm = document.getElementById('search-form');
  const resultsContainer = document.getElementById('results-container');
  const exploreBtn = document.getElementById('explore-btn');
  const trackBtn = document.getElementById('track-btn');
  const liveResult = document.getElementById('live-status-result');

  // Load all trains without filter
  if (exploreBtn) {
    exploreBtn.addEventListener('click', async () => {
      try {
        const dateStr = document.getElementById('date').value || new Date().toISOString().split('T')[0];
        const trains = await window.api.trains.getAll();
        displayTrains(trains, dateStr);
        window.showToast(`Loaded all ${trains.length} trains!`);
      } catch (error) {
        window.showToast('Error: ' + error.message, true);
      }
    });
  }

  // Live Tracking Logic Simulation
  if (trackBtn) {
    trackBtn.addEventListener('click', () => {
      const tNum = document.getElementById('live-train-number').value;
      if (!tNum) return window.showToast('Enter a train number first.', true);
      
      const stations = ['Approaching Station', 'Departed from Station', 'Halted at Signal', 'Crossing Bridge'];
      const delays = ['On Time', 'Delayed by 15 mins', 'Delayed by 45 mins', 'On Time', 'Running early'];
      const currentLoc = stations[Math.floor(Math.random() * stations.length)];
      const delayStatus = delays[Math.floor(Math.random() * delays.length)];
      const delayColor = delayStatus.includes('Delayed') ? 'var(--accent-color)' : '#10B981';

      liveResult.style.display = 'block';
      liveResult.innerHTML = `
        <div style="font-weight: 600; font-size: 1.1rem; border-bottom: 1px solid #ddd; padding-bottom: 0.5rem; margin-bottom: 0.5rem;">
          Train: ${tNum.toUpperCase()}
        </div>
        <div style="display: flex; justify-content: space-between; flex-wrap: wrap;">
          <div><strong>Current Status:</strong> <span style="color: #444;">${currentLoc}</span></div>
          <div><strong>Delay/Status:</strong> <span style="font-weight: bold; color: ${delayColor};">${delayStatus}</span></div>
        </div>
        <div style="margin-top: 0.5rem; font-size: 0.85rem; color: #666;">
          <em>Last updated: Just now (Simulated API)</em>
        </div>
      `;
    });
  }

  if (searchForm) {
    searchForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const source = document.getElementById('source').value;
      const destination = document.getElementById('destination').value;
      const date = document.getElementById('date').value;

      if (!date) {
        window.showToast('Please select a travel date', true);
        return;
      }

      try {
        const trains = await window.api.trains.getAll(source, destination);
        displayTrains(trains, date);
      } catch (error) {
        window.showToast('Error fetching trains: ' + error.message, true);
      }
    });
  }

  function displayTrains(trains, date) {
    window.currentTrains = trains; // Save for modal
    resultsContainer.innerHTML = '';
    
    if (trains.length === 0) {
      resultsContainer.innerHTML = `<div class="glass-panel text-center" style="grid-column: 1/-1"><h3>No trains found for this route.</h3></div>`;
      return;
    }

    const allDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    trains.forEach(train => {
      const card = document.createElement('div');
      card.className = 'train-card';
      const trainDays = train.runningDays || allDays;

      card.innerHTML = `
        <div class="train-header">
          <h3 style="margin:0">${train.trainName} <span style="font-size: 0.8rem; color:#888;">(${train.trainNumber})</span></h3>
          <span style="font-weight:bold; color:var(--primary-color)">₹${train.pricePerSeat}</span>
        </div>
        <div class="train-route">
          <div class="text-center">
            <div style="font-size:1.2rem">${train.departureTime}</div>
            <div style="color:#666; font-size:0.9rem">${train.source}</div>
          </div>
          <div class="route-arrow">➔</div>
          <div class="text-center">
            <div style="font-size:1.2rem">${train.arrivalTime}</div>
            <div style="color:#666; font-size:0.9rem">${train.destination}</div>
          </div>
        </div>
        <div style="margin-bottom: 0.8rem; display: flex; gap: 4px; justify-content: center;">
          ${allDays.map(day => `
            <span style="font-size: 0.75rem; padding: 2px 6px; border-radius: 4px; border: 1px solid #ccc; font-weight: 600;
              ${trainDays.includes(day) ? 'background: var(--primary-color); color: white; border-color: var(--primary-color);' : 'color: #aaa; background: #f9f9f9;'}">
              ${day.charAt(0)}
            </span>
          `).join('')}
        </div>
        <div style="margin-bottom: 1rem; text-align: center; color: ${train.availableSeats > 0 ? '#10B981' : 'var(--accent-color)'}; font-weight: 600;">
          Available Seats: ${train.availableSeats}
        </div>
        <div style="display: flex; gap: 0.5rem; justify-content: center;">
          <button class="btn btn-outline" onclick="viewTrainStructure('${train._id}')" style="padding: 0.5rem 1rem;">View Layout</button>
          <button class="btn" ${train.availableSeats === 0 ? 'disabled style="opacity:0.5"' : ''} onclick="bookTrain('${train._id}', '${date}', ${train.pricePerSeat})" style="padding: 0.5rem 1rem;">
            ${train.availableSeats === 0 ? 'Waitlist' : 'Select Train'}
          </button>
        </div>
      `;
      resultsContainer.appendChild(card);
    });
  }

  window.quickSearch = (src, dest) => {
    document.getElementById('source').value = src;
    document.getElementById('destination').value = dest;
    // Set date to today
    const current = new Date().toISOString().split('T')[0];
    document.getElementById('date').value = current;
    
    // trigger submit manually
    searchForm.dispatchEvent(new Event('submit'));
  };

  window.bookTrain = (trainId, date, price) => {
    const user = localStorage.getItem('user');
    if (!user) {
      window.showToast('Please login to book a ticket', true);
      setTimeout(() => window.location.href = 'login.html', 1500);
      return;
    }
    // Store selected train details in sessionStorage for the booking page
    sessionStorage.setItem('selectedTrain', trainId);
    sessionStorage.setItem('travelDate', date);
    sessionStorage.setItem('trainPrice', price);
    window.location.href = 'booking.html';
  };

  window.viewTrainStructure = (trainId) => {
    const train = window.currentTrains.find(t => t._id === trainId);
    if (!train) return;
    
    const container = document.getElementById('structure-content');
    container.innerHTML = ''; // clear

    // Add Engine
    container.innerHTML += `
      <div style="min-width: 80px; height: 60px; background: #ea580c; color: white; border-radius: 8px 30px 30px 8px; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 2px solid #c2410c; position: relative;">
        ENG
        <div style="position: absolute; right: -8px; width: 8px; height: 4px; background: #333; top: 28px;"></div>
      </div>
    `;

    // Add Coaches
    if (train.coaches && train.coaches.length > 0) {
      train.coaches.forEach((c, index) => {
        let color = '#3b82f6'; // default blue
        if (c.classType === '3AC') color = '#0ea5e9'; // lighter blue
        if (c.classType === '2AC') color = '#6366f1'; // indigo
        if (c.classType === '1AC') color = '#8b5cf6'; // purple
        
        const isFull = c.availableSeats === 0;
        const opacity = isFull ? '0.6' : '1';

        const hasNext = index < train.coaches.length - 1;
        const linkStr = hasNext ? `<div style="position: absolute; right: -8px; width: 8px; height: 4px; background: #333; top: 28px;"></div>` : '';

        container.innerHTML += `
          <div style="min-width: 90px; height: 60px; background: ${color}; color: white; border-radius: 8px; display: flex; flex-direction: column; align-items: center; justify-content: center; font-size: 0.8rem; border: 2px solid rgba(0,0,0,0.2); position: relative; opacity: ${opacity}; cursor: pointer;" onclick="viewSeatConfiguration('${train._id}', '${c.coachName}', ${c.totalSeats}, '${c.classType}', ${train.pricePerSeat})">
            <span style="font-weight: bold; font-size: 1rem;">${c.coachName}</span>
            <span style="font-size: 0.7rem; background: rgba(0,0,0,0.2); padding: 1px 4px; border-radius: 4px;">${c.availableSeats}/${c.totalSeats}</span>
            ${linkStr}
          </div>
        `;
      });
    }

    document.getElementById('structure-modal').classList.add('active');
  };

  window.viewSeatConfiguration = async (trainId, coachName, totalSeats, classType, price) => {
    const date = document.getElementById('date').value;
    if (!date) return window.showToast('Please select travel date first', true);

    try {
      // Show loading or just wait
      const bookedSeatsParams = await window.api.trains.getBookedSeats(trainId, date);
      // bookedSeatsParams is array of {coach: 'S1', seatNumber: 5}
      const bookedSet = new Set(
        bookedSeatsParams.filter(b => b.coach === coachName).map(b => b.seatNumber)
      );

      document.getElementById('seat-modal-title').innerText = `💺 Coach ${coachName} (${classType})`;
      const seatGrid = document.getElementById('seat-grid');
      seatGrid.innerHTML = '';
      document.getElementById('selected-seat-text').innerText = 'No seat selected';
      document.getElementById('book-selected-seat-btn').style.display = 'none';

      let selectedSeats = [];

      for (let i = 1; i <= totalSeats; i++) {
        const isBooked = bookedSet.has(i);
        const seatDiv = document.createElement('div');
        seatDiv.style.cssText = `
          padding: 10px; text-align: center; border-radius: 5px; font-weight: bold; cursor: ${isBooked ? 'not-allowed' : 'pointer'};
          background: ${isBooked ? '#ccc' : '#e0f2fe'}; color: ${isBooked ? '#666' : '#0369a1'};
          border: 2px solid ${isBooked ? '#aaa' : '#bae6fd'};
        `;
        seatDiv.innerText = i;

        if (!isBooked) {
          seatDiv.addEventListener('click', () => {
            const index = selectedSeats.indexOf(i);
            if (index > -1) {
              // Deselect
              selectedSeats.splice(index, 1);
              seatDiv.style.background = '#e0f2fe';
              seatDiv.style.color = '#0369a1';
              seatDiv.style.borderColor = '#bae6fd';
            } else {
              // Select
              selectedSeats.push(i);
              seatDiv.style.background = '#0ea5e9';
              seatDiv.style.color = 'white';
              seatDiv.style.borderColor = '#0284c7';
            }
            
            selectedSeats.sort((a,b) => a-b);
            
            if (selectedSeats.length > 0) {
              document.getElementById('selected-seat-text').innerText = `Selected: Seat(s) ${selectedSeats.join(', ')} in Coach ${coachName}`;
              document.getElementById('selected-seat-text').style.color = '#10B981';
              document.getElementById('book-selected-seat-btn').style.display = 'block';
              document.getElementById('book-selected-seat-btn').innerText = `Book ${selectedSeats.length} Seat(s)`;
            } else {
              document.getElementById('selected-seat-text').innerText = 'No seat selected';
              document.getElementById('selected-seat-text').style.color = 'var(--primary-color)';
              document.getElementById('book-selected-seat-btn').style.display = 'none';
            }
            
            document.getElementById('book-selected-seat-btn').onclick = () => {
              sessionStorage.setItem('selectedCoach', coachName);
              sessionStorage.setItem('selectedSeats', JSON.stringify(selectedSeats));
              sessionStorage.setItem('selectedClass', classType);
              bookTrain(trainId, date, price);
            };
          });
        }
        seatGrid.appendChild(seatDiv);
      }

      // Hide structure modal to show seat modal cleanly
      document.getElementById('structure-modal').classList.remove('active');
      document.getElementById('seat-modal').classList.add('active');

    } catch (error) {
       window.showToast('Failed to load seat layout', true);
    }
  };
});
