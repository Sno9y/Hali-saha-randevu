// Firebase Ayarları (Veritabanı bağlantı adresiniz eklendi)
const firebaseConfig = {
  databaseURL: "https://hali-saha-db-default-rtdb.firebaseio.com"
};

// Firebase Başlatma
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
const database = firebase.database();
const appointmentsRef = database.ref('appointments');

// Yönetici Şifresi (Siz istediğiniz zaman değiştirebilirsiniz)
const ADMIN_PIN = "9999"; 

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('bookingForm');
  const appointmentList = document.getElementById('appointmentList');

  // Geçmiş tarihlerin seçilmesini engelle
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('date').setAttribute('min', today);

  let currentAppointments = {};

  // Firebase'den Verileri Canlı Dinle (Tüm çalışanlarda anında güncellenir)
  appointmentsRef.on('value', (snapshot) => {
    currentAppointments = snapshot.val() || {};
    renderAppointments(currentAppointments);
  });

  function renderAppointments(data) {
    appointmentList.innerHTML = '';
    const keys = Object.keys(data);

    if (keys.length === 0) {
      appointmentList.innerHTML = '<li class="empty-state">Henüz oluşturulmuş bir randevu yok.</li>';
      return;
    }

    // Randevuları dönüştür ve tarihe göre sırala
    const appArray = keys.map(key => ({ id: key, ...data[key] }));
    appArray.sort((a, b) => new Date(`${a.date} ${a.time.split(' - ')[0]}`) - new Date(`${b.date} ${b.time.split(' - ')[0]}`));

    appArray.forEach((item) => {
      const li = document.createElement('li');
      li.className = 'appointment-item';
      li.innerHTML = `
        <div class="appointment-info">
          <strong>${item.name} (Sicil No: ${item.registrationNo})</strong>
          📅 ${formatDate(item.date)} | ⏰ ${item.time}
        </div>
        <button class="delete-btn" onclick="deleteAppointment('${item.id}')">İptal</button>
      `;
      appointmentList.appendChild(li);
    });
  }

  function formatDate(dateStr) {
    const [year, month, day] = dateStr.split('-');
    return `${day}.${month}.${year}`;
  }

  // Yeni Randevu Ekleme
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = document.getElementById('name').value.trim();
    const registrationNo = document.getElementById('registrationNo').value.trim();
    const cancelPin = document.getElementById('cancelPin').value.trim();
    const date = document.getElementById('date').value;
    const time = document.getElementById('time').value;

    // Aynı tarih ve saat çakışması kontrolü
    const isConflict = Object.values(currentAppointments).some(
      app => app.date === date && app.time === time
    );

    if (isConflict) {
      alert('Seçtiğiniz tarih ve saatte zaten başkası tarafından rezervasyon yapılmış!');
      return;
    }

    // Firebase'e yeni randevu kaydet
    const newAppointmentRef = appointmentsRef.push();
    newAppointmentRef.set({
      name,
      registrationNo,
      cancelPin,
      date,
      time
    }).then(() => {
      alert('Randevunuz başarıyla oluşturuldu!');
      form.reset();
    }).catch((error) => {
      alert('Hata oluştu: ' + error.message);
    });
  });

  // Randevu İptal Etme
  window.deleteAppointment = (id) => {
    const targetApp = currentAppointments[id];
    if (!targetApp) return;

    const enteredPin = prompt("Randevuyu iptal etmek için randevu oluştururken belirlediğiniz 4 haneli PIN şifrenizi girin (VEYA Admin Şifresini girin):");

    if (enteredPin === null) return; // İptal tıklandıysa çık

    // Şifre kontrolü: Kullanıcının belirlediği PIN veya Admin PIN'i doğru mu?
    if (enteredPin === targetApp.cancelPin || enteredPin === ADMIN_PIN) {
      if (confirm('Randevuyu iptal etmek istediğinize emin misiniz?')) {
        appointmentsRef.child(id).remove()
          .then(() => alert('Randevu başarıyla silindi.'))
          .catch((err) => alert('Silme hatası: ' + err.message));
      }
    } else {
      alert('Hatalı Şifre! Randevuyu sadece oluşturan kişi veya Yönetici silebilir.');
    }
  };
});
