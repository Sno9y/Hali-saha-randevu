document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('bookingForm');
  const appointmentList = document.getElementById('appointmentList');

  // Sayfa açıldığında tarayıcı hafızasındaki verileri yükle
  let appointments = JSON.parse(localStorage.getItem('field_appointments')) || [];

  // Tarih seçiminde geçmiş günleri engelle
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('date').setAttribute('min', today);

  function renderAppointments() {
    appointmentList.innerHTML = '';

    if (appointments.length === 0) {
      appointmentList.innerHTML = '<li class="empty-state">Henüz oluşturulmuş bir randevu yok.</li>';
      return;
    }

    // Tarihe göre sırala
    appointments.sort((a, b) => new Date(`${a.date} ${a.time.split(' - ')[0]}`) - new Date(`${b.date} ${b.time.split(' - ')[0]}`));

    appointments.forEach((item, index) => {
      const li = document.createElement('li');
      li.className = 'appointment-item';
      li.innerHTML = `
        <div class="appointment-info">
          <strong>${item.name} (Sicil No: ${item.registrationNo})</strong>
          📅 ${formatDate(item.date)} | ⏰ ${item.time}
        </div>
        <button class="delete-btn" onclick="deleteAppointment(${index})">İptal</button>
      `;
      appointmentList.appendChild(li);
    });
  }

  function formatDate(dateStr) {
    const [year, month, day] = dateStr.split('-');
    return `${day}.${month}.${year}`;
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = document.getElementById('name').value.trim();
    const registrationNo = document.getElementById('registrationNo').value.trim();
    const date = document.getElementById('date').value;
    const time = document.getElementById('time').value;

    // Aynı tarih ve saatte başka randevu var mı kontrol et
    const isConflict = appointments.some(app => app.date === date && app.time === time);

    if (isConflict) {
      alert('Seçtiğiniz tarih ve saatte zaten bir rezervasyon var! Lütfen başka bir saat seçin.');
      return;
    }

    // Yeni randevuyu ekle
    const newAppointment = { name, registrationNo, date, time };
    appointments.push(newAppointment);

    // LocalStorage'a kaydet
    localStorage.setItem('field_appointments', JSON.stringify(appointments));

    // Formu sıfırla ve listeyi güncelle
    form.reset();
    renderAppointments();
  });

  window.deleteAppointment = (index) => {
    if (confirm('Bu randevuyu iptal etmek istediğinize emin misiniz?')) {
      appointments.splice(index, 1);
      localStorage.setItem('field_appointments', JSON.stringify(appointments));
      renderAppointments();
    }
  };

  renderAppointments();
});
