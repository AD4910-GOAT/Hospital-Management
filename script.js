const API_URL = 'http://localhost:5000/api';
let allPatients = [];
let allDoctors = [];
let allAppointments = [];
let allMedicalRecords = [];
let allBilling = [];

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadDashboard();
    addAnimationEffects();
    setupSmoothTransitions();
});

// Add smooth animations on page load
function addAnimationEffects() {
    const elements = document.querySelectorAll('.nav-link, .stat-card, .section');
    elements.forEach((el, index) => {
        el.style.animation = `fadeInUp 0.5s ease ${index * 0.1}s both`;
    });
}

// Setup smooth transitions
function setupSmoothTransitions() {
    document.querySelectorAll('input, select, textarea').forEach(input => {
        input.addEventListener('focus', function() {
            this.style.boxShadow = '0 0 30px rgba(102, 126, 234, 0.5)';
        });
        input.addEventListener('blur', function() {
            this.style.boxShadow = '';
        });
    });
}

// Section Management
function showSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });

    // Remove active class from all nav links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });

    // Show selected section
    document.getElementById(sectionId).classList.add('active');
    
    // Add active class to clicked nav link
    event.target.classList.add('active');

    // Update page title
    const titles = {
        'dashboard': 'Dashboard',
        'patients': 'Patient Management',
        'doctors': 'Doctor Management',
        'appointments': 'Appointment Management',
        'medical-records': 'Medical Records',
        'billing': 'Billing Management'
    };
    document.getElementById('page-title').textContent = titles[sectionId];

    // Load data for the section
    switch(sectionId) {
        case 'patients':
            loadPatients();
            break;
        case 'doctors':
            loadDoctors();
            break;
        case 'appointments':
            loadAppointments();
            break;
        case 'medical-records':
            loadMedicalRecords();
            break;
        case 'billing':
            loadBilling();
            break;
        case 'dashboard':
            loadDashboard();
            break;
    }
}

// ==================== DASHBOARD ====================
async function loadDashboard() {
    try {
        const [patients, doctors, appointments, billing] = await Promise.all([
            fetch(`${API_URL}/patients`).then(r => r.json()),
            fetch(`${API_URL}/doctors`).then(r => r.json()),
            fetch(`${API_URL}/appointments`).then(r => r.json()),
            fetch(`${API_URL}/billing`).then(r => r.json())
        ]);

        // Update stats
        document.getElementById('totalPatients').textContent = patients.length;
        document.getElementById('totalDoctors').textContent = doctors.length;
        document.getElementById('totalAppointments').textContent = appointments.filter(a => a.status === 'scheduled').length;
        
        const totalRevenue = billing.filter(b => b.status === 'paid').reduce((sum, b) => sum + b.amount, 0);
        document.getElementById('totalRevenue').textContent = '$' + totalRevenue.toFixed(2);

        // Load recent appointments
        const recentAppts = appointments.slice(0, 5);
        const tbody = document.querySelector('#recent-appointments tbody');
        tbody.innerHTML = recentAppts.map(appt => `
            <tr>
                <td>${appt.patientName}</td>
                <td>${appt.doctorName}</td>
                <td>${formatDate(appt.appointmentDate)}</td>
                <td><span class="status-badge status-${appt.status}">${appt.status}</span></td>
            </tr>
        `).join('');
    } catch(err) {
        console.error('Error loading dashboard:', err);
    }
}

// ==================== PATIENTS ====================
async function loadPatients() {
    try {
        const response = await fetch(`${API_URL}/patients`);
        allPatients = await response.json();
        renderPatients(allPatients);
    } catch(err) {
        console.error('Error loading patients:', err);
        alert('Error loading patients');
    }
}

function renderPatients(patients) {
    const tbody = document.querySelector('#patients-table tbody');
    tbody.innerHTML = patients.map(patient => `
        <tr>
            <td>${patient.id}</td>
            <td>${patient.name}</td>
            <td>${patient.email || '-'}</td>
            <td>${patient.phone || '-'}</td>
            <td>${patient.bloodType || '-'}</td>
            <td>${formatDate(patient.dateOfBirth) || '-'}</td>
            <td>
                <div class="action-buttons">
                    <button onclick="editPatient(${patient.id})" class="btn btn-small btn-info">Edit</button>
                    <button onclick="deletePatient(${patient.id})" class="btn btn-small btn-danger">Delete</button>
                </div>
            </td>
        </tr>
    `).join('');
}

function filterPatients() {
    const search = document.getElementById('patientSearch').value.toLowerCase();
    const filtered = allPatients.filter(p => 
        p.name.toLowerCase().includes(search) ||
        (p.email && p.email.toLowerCase().includes(search)) ||
        (p.phone && p.phone.includes(search))
    );
    renderPatients(filtered);
}

function openPatientModal(patientId = null) {
    const modal = document.getElementById('patientModal');
    modal.classList.add('show');
    
    if (patientId) {
        const patient = allPatients.find(p => p.id === patientId);
        document.getElementById('patientId').value = patient.id;
        document.getElementById('patientName').value = patient.name;
        document.getElementById('patientEmail').value = patient.email || '';
        document.getElementById('patientPhone').value = patient.phone || '';
        document.getElementById('patientDOB').value = patient.dateOfBirth || '';
        document.getElementById('patientGender').value = patient.gender || '';
        document.getElementById('patientBloodType').value = patient.bloodType || '';
        document.getElementById('patientAddress').value = patient.address || '';
        document.getElementById('patientEmergency').value = patient.emergencyContact || '';
    } else {
        document.getElementById('patientForm').reset();
        document.getElementById('patientId').value = '';
    }
}

function closePatientModal() {
    document.getElementById('patientModal').classList.remove('show');
}

async function savePatient(e) {
    e.preventDefault();
    const patientId = document.getElementById('patientId').value;
    const data = {
        name: document.getElementById('patientName').value,
        email: document.getElementById('patientEmail').value,
        phone: document.getElementById('patientPhone').value,
        dateOfBirth: document.getElementById('patientDOB').value,
        gender: document.getElementById('patientGender').value,
        bloodType: document.getElementById('patientBloodType').value,
        address: document.getElementById('patientAddress').value,
        emergencyContact: document.getElementById('patientEmergency').value
    };

    try {
        const url = patientId ? `${API_URL}/patients/${patientId}` : `${API_URL}/patients`;
        const method = patientId ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            closePatientModal();
            loadPatients();
            alert('Patient saved successfully');
        } else {
            alert('Error saving patient');
        }
    } catch(err) {
        console.error('Error:', err);
        alert('Error saving patient');
    }
}

async function editPatient(patientId) {
    openPatientModal(patientId);
}

async function deletePatient(patientId) {
    if (confirm('Are you sure you want to delete this patient?')) {
        try {
            const response = await fetch(`${API_URL}/patients/${patientId}`, { method: 'DELETE' });
            if (response.ok) {
                loadPatients();
                alert('Patient deleted successfully');
            }
        } catch(err) {
            alert('Error deleting patient');
        }
    }
}

// ==================== DOCTORS ====================
async function loadDoctors() {
    try {
        const response = await fetch(`${API_URL}/doctors`);
        allDoctors = await response.json();
        renderDoctors(allDoctors);
    } catch(err) {
        console.error('Error loading doctors:', err);
    }
}

function renderDoctors(doctors) {
    const tbody = document.querySelector('#doctors-table tbody');
    tbody.innerHTML = doctors.map(doctor => `
        <tr>
            <td>${doctor.id}</td>
            <td>${doctor.name}</td>
            <td>${doctor.specialization}</td>
            <td>${doctor.email || '-'}</td>
            <td>${doctor.phone || '-'}</td>
            <td>${doctor.license || '-'}</td>
            <td>
                <div class="action-buttons">
                    <button onclick="editDoctor(${doctor.id})" class="btn btn-small btn-info">Edit</button>
                    <button onclick="deleteDoctor(${doctor.id})" class="btn btn-small btn-danger">Delete</button>
                </div>
            </td>
        </tr>
    `).join('');
}

function filterDoctors() {
    const search = document.getElementById('doctorSearch').value.toLowerCase();
    const filtered = allDoctors.filter(d => 
        d.name.toLowerCase().includes(search) ||
        d.specialization.toLowerCase().includes(search) ||
        (d.email && d.email.toLowerCase().includes(search))
    );
    renderDoctors(filtered);
}

function openDoctorModal(doctorId = null) {
    const modal = document.getElementById('doctorModal');
    modal.classList.add('show');
    
    if (doctorId) {
        const doctor = allDoctors.find(d => d.id === doctorId);
        document.getElementById('doctorId').value = doctor.id;
        document.getElementById('doctorName').value = doctor.name;
        document.getElementById('doctorEmail').value = doctor.email || '';
        document.getElementById('doctorPhone').value = doctor.phone || '';
        document.getElementById('doctorSpecialization').value = doctor.specialization;
        document.getElementById('doctorLicense').value = doctor.license || '';
        document.getElementById('doctorAvailableFrom').value = doctor.availableFrom || '';
        document.getElementById('doctorAvailableTo').value = doctor.availableTo || '';
    } else {
        document.getElementById('doctorForm').reset();
        document.getElementById('doctorId').value = '';
    }
}

function closeDoctorModal() {
    document.getElementById('doctorModal').classList.remove('show');
}

async function saveDoctor(e) {
    e.preventDefault();
    const doctorId = document.getElementById('doctorId').value;
    const data = {
        name: document.getElementById('doctorName').value,
        email: document.getElementById('doctorEmail').value,
        phone: document.getElementById('doctorPhone').value,
        specialization: document.getElementById('doctorSpecialization').value,
        license: document.getElementById('doctorLicense').value,
        availableFrom: document.getElementById('doctorAvailableFrom').value,
        availableTo: document.getElementById('doctorAvailableTo').value
    };

    try {
        const url = doctorId ? `${API_URL}/doctors/${doctorId}` : `${API_URL}/doctors`;
        const method = doctorId ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            closeDoctorModal();
            loadDoctors();
            alert('Doctor saved successfully');
        }
    } catch(err) {
        alert('Error saving doctor');
    }
}

async function editDoctor(doctorId) {
    openDoctorModal(doctorId);
}

async function deleteDoctor(doctorId) {
    if (confirm('Are you sure you want to delete this doctor?')) {
        try {
            const response = await fetch(`${API_URL}/doctors/${doctorId}`, { method: 'DELETE' });
            if (response.ok) {
                loadDoctors();
                alert('Doctor deleted successfully');
            }
        } catch(err) {
            alert('Error deleting doctor');
        }
    }
}

// ==================== APPOINTMENTS ====================
async function loadAppointments() {
    try {
        const response = await fetch(`${API_URL}/appointments`);
        allAppointments = await response.json();
        renderAppointments(allAppointments);
    } catch(err) {
        console.error('Error loading appointments:', err);
    }
}

function renderAppointments(appointments) {
    const tbody = document.querySelector('#appointments-table tbody');
    tbody.innerHTML = appointments.map(appt => `
        <tr>
            <td>${appt.id}</td>
            <td>${appt.patientName}</td>
            <td>${appt.doctorName}</td>
            <td>${formatDate(appt.appointmentDate)}</td>
            <td>${appt.appointmentTime}</td>
            <td><span class="status-badge status-${appt.status}">${appt.status}</span></td>
            <td>
                <div class="action-buttons">
                    <button onclick="editAppointment(${appt.id})" class="btn btn-small btn-info">Edit</button>
                    <button onclick="deleteAppointment(${appt.id})" class="btn btn-small btn-danger">Delete</button>
                </div>
            </td>
        </tr>
    `).join('');
}

function filterAppointments() {
    const search = document.getElementById('appointmentSearch').value.toLowerCase();
    const filtered = allAppointments.filter(a => 
        a.patientName.toLowerCase().includes(search) ||
        a.doctorName.toLowerCase().includes(search)
    );
    renderAppointments(filtered);
}

async function openAppointmentModal(appointmentId = null) {
    const modal = document.getElementById('appointmentModal');
    modal.classList.add('show');
    
    // Load patients and doctors for dropdowns
    if (allPatients.length === 0) {
        allPatients = await fetch(`${API_URL}/patients`).then(r => r.json());
    }
    if (allDoctors.length === 0) {
        allDoctors = await fetch(`${API_URL}/doctors`).then(r => r.json());
    }

    const patientSelect = document.getElementById('appointmentPatient');
    const doctorSelect = document.getElementById('appointmentDoctor');
    
    patientSelect.innerHTML = '<option value="">Select Patient</option>' + 
        allPatients.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
    
    doctorSelect.innerHTML = '<option value="">Select Doctor</option>' + 
        allDoctors.map(d => `<option value="${d.id}">${d.name} (${d.specialization})</option>`).join('');

    if (appointmentId) {
        const appt = allAppointments.find(a => a.id === appointmentId);
        document.getElementById('appointmentId').value = appt.id;
        document.getElementById('appointmentPatient').value = appt.patientId;
        document.getElementById('appointmentDoctor').value = appt.doctorId;
        document.getElementById('appointmentDate').value = appt.appointmentDate;
        document.getElementById('appointmentTime').value = appt.appointmentTime;
        document.getElementById('appointmentStatus').value = appt.status;
        document.getElementById('appointmentNotes').value = appt.notes || '';
    } else {
        document.getElementById('appointmentForm').reset();
        document.getElementById('appointmentId').value = '';
    }
}

function closeAppointmentModal() {
    document.getElementById('appointmentModal').classList.remove('show');
}

async function saveAppointment(e) {
    e.preventDefault();
    const appointmentId = document.getElementById('appointmentId').value;
    const data = {
        patientId: document.getElementById('appointmentPatient').value,
        doctorId: document.getElementById('appointmentDoctor').value,
        appointmentDate: document.getElementById('appointmentDate').value,
        appointmentTime: document.getElementById('appointmentTime').value,
        status: document.getElementById('appointmentStatus').value,
        notes: document.getElementById('appointmentNotes').value
    };

    try {
        const url = appointmentId ? `${API_URL}/appointments/${appointmentId}` : `${API_URL}/appointments`;
        const method = appointmentId ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            closeAppointmentModal();
            loadAppointments();
            alert('Appointment saved successfully');
        }
    } catch(err) {
        alert('Error saving appointment');
    }
}

async function editAppointment(appointmentId) {
    openAppointmentModal(appointmentId);
}

async function deleteAppointment(appointmentId) {
    if (confirm('Are you sure you want to delete this appointment?')) {
        try {
            const response = await fetch(`${API_URL}/appointments/${appointmentId}`, { method: 'DELETE' });
            if (response.ok) {
                loadAppointments();
                alert('Appointment deleted successfully');
            }
        } catch(err) {
            alert('Error deleting appointment');
        }
    }
}

// ==================== MEDICAL RECORDS ====================
async function loadMedicalRecords() {
    try {
        const response = await fetch(`${API_URL}/medical-records`);
        allMedicalRecords = await response.json();
        renderMedicalRecords(allMedicalRecords);
    } catch(err) {
        console.error('Error loading medical records:', err);
    }
}

function renderMedicalRecords(records) {
    const tbody = document.querySelector('#medical-records-table tbody');
    tbody.innerHTML = records.map(record => `
        <tr>
            <td>${record.id}</td>
            <td>${record.patientName}</td>
            <td>${record.doctorName || '-'}</td>
            <td>${record.diagnosis.substring(0, 50)}...</td>
            <td>${formatDate(record.recordDate)}</td>
            <td>
                <div class="action-buttons">
                    <button onclick="editMedicalRecord(${record.id})" class="btn btn-small btn-info">View</button>
                    <button onclick="deleteMedicalRecord(${record.id})" class="btn btn-small btn-danger">Delete</button>
                </div>
            </td>
        </tr>
    `).join('');
}

function filterMedicalRecords() {
    const search = document.getElementById('medicalSearch').value.toLowerCase();
    const filtered = allMedicalRecords.filter(m => 
        m.patientName.toLowerCase().includes(search) ||
        m.diagnosis.toLowerCase().includes(search)
    );
    renderMedicalRecords(filtered);
}

async function openMedicalRecordModal(recordId = null) {
    const modal = document.getElementById('medicalRecordModal');
    modal.classList.add('show');
    
    // Load patients and doctors for dropdowns
    if (allPatients.length === 0) {
        allPatients = await fetch(`${API_URL}/patients`).then(r => r.json());
    }
    if (allDoctors.length === 0) {
        allDoctors = await fetch(`${API_URL}/doctors`).then(r => r.json());
    }

    const patientSelect = document.getElementById('medicalPatient');
    const doctorSelect = document.getElementById('medicalDoctor');
    
    patientSelect.innerHTML = '<option value="">Select Patient</option>' + 
        allPatients.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
    
    doctorSelect.innerHTML = '<option value="">Select Doctor</option>' + 
        allDoctors.map(d => `<option value="${d.id}">${d.name}</option>`).join('');

    if (recordId) {
        const record = allMedicalRecords.find(r => r.id === recordId);
        document.getElementById('medicalRecordId').value = record.id;
        document.getElementById('medicalPatient').value = record.patientId;
        document.getElementById('medicalDoctor').value = record.doctorId || '';
        document.getElementById('medicalDiagnosis').value = record.diagnosis;
        document.getElementById('medicalTreatment').value = record.treatment || '';
        document.getElementById('medicalPrescriptions').value = record.prescriptions || '';
        document.getElementById('medicalNotes').value = record.notes || '';
    } else {
        document.getElementById('medicalRecordForm').reset();
        document.getElementById('medicalRecordId').value = '';
    }
}

function closeMedicalRecordModal() {
    document.getElementById('medicalRecordModal').classList.remove('show');
}

async function saveMedicalRecord(e) {
    e.preventDefault();
    const recordId = document.getElementById('medicalRecordId').value;
    const data = {
        patientId: document.getElementById('medicalPatient').value,
        doctorId: document.getElementById('medicalDoctor').value,
        diagnosis: document.getElementById('medicalDiagnosis').value,
        treatment: document.getElementById('medicalTreatment').value,
        prescriptions: document.getElementById('medicalPrescriptions').value,
        notes: document.getElementById('medicalNotes').value
    };

    try {
        const url = recordId ? `${API_URL}/medical-records/${recordId}` : `${API_URL}/medical-records`;
        const method = recordId ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            closeMedicalRecordModal();
            loadMedicalRecords();
            alert('Medical record saved successfully');
        }
    } catch(err) {
        alert('Error saving medical record');
    }
}

async function editMedicalRecord(recordId) {
    openMedicalRecordModal(recordId);
}

async function deleteMedicalRecord(recordId) {
    if (confirm('Are you sure you want to delete this medical record?')) {
        try {
            const response = await fetch(`${API_URL}/medical-records/${recordId}`, { method: 'DELETE' });
            if (response.ok) {
                loadMedicalRecords();
                alert('Medical record deleted successfully');
            }
        } catch(err) {
            alert('Error deleting medical record');
        }
    }
}

// ==================== BILLING ====================
async function loadBilling() {
    try {
        const response = await fetch(`${API_URL}/billing`);
        allBilling = await response.json();
        renderBilling(allBilling);
    } catch(err) {
        console.error('Error loading billing:', err);
    }
}

function renderBilling(bills) {
    const tbody = document.querySelector('#billing-table tbody');
    tbody.innerHTML = bills.map(bill => `
        <tr>
            <td>${bill.id}</td>
            <td>${bill.patientName}</td>
            <td>$${bill.amount.toFixed(2)}</td>
            <td>${bill.description || '-'}</td>
            <td><span class="status-badge status-${bill.status}">${bill.status}</span></td>
            <td>${formatDate(bill.paymentDate) || '-'}</td>
            <td>
                <div class="action-buttons">
                    <button onclick="editBilling(${bill.id})" class="btn btn-small btn-info">Edit</button>
                    <button onclick="deleteBilling(${bill.id})" class="btn btn-small btn-danger">Delete</button>
                </div>
            </td>
        </tr>
    `).join('');
}

function filterBilling() {
    const search = document.getElementById('billingSearch').value.toLowerCase();
    const filtered = allBilling.filter(b => 
        b.patientName.toLowerCase().includes(search) ||
        (b.description && b.description.toLowerCase().includes(search))
    );
    renderBilling(filtered);
}

async function openBillingModal(billId = null) {
    const modal = document.getElementById('billingModal');
    modal.classList.add('show');
    
    // Load patients for dropdown
    if (allPatients.length === 0) {
        allPatients = await fetch(`${API_URL}/patients`).then(r => r.json());
    }

    const patientSelect = document.getElementById('billingPatient');
    patientSelect.innerHTML = '<option value="">Select Patient</option>' + 
        allPatients.map(p => `<option value="${p.id}">${p.name}</option>`).join('');

    if (billId) {
        const bill = allBilling.find(b => b.id === billId);
        document.getElementById('billingId').value = bill.id;
        document.getElementById('billingPatient').value = bill.patientId;
        document.getElementById('billingAmount').value = bill.amount;
        document.getElementById('billingDescription').value = bill.description || '';
        document.getElementById('billingStatus').value = bill.status;
    } else {
        document.getElementById('billingForm').reset();
        document.getElementById('billingId').value = '';
    }
}

function closeBillingModal() {
    document.getElementById('billingModal').classList.remove('show');
}

async function saveBilling(e) {
    e.preventDefault();
    const billId = document.getElementById('billingId').value;
    const data = {
        patientId: document.getElementById('billingPatient').value,
        amount: parseFloat(document.getElementById('billingAmount').value),
        description: document.getElementById('billingDescription').value,
        status: document.getElementById('billingStatus').value
    };

    try {
        const url = billId ? `${API_URL}/billing/${billId}` : `${API_URL}/billing`;
        const method = billId ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            closeBillingModal();
            loadBilling();
            alert('Billing record saved successfully');
        }
    } catch(err) {
        alert('Error saving billing record');
    }
}

async function editBilling(billId) {
    openBillingModal(billId);
}

async function deleteBilling(billId) {
    if (confirm('Are you sure you want to delete this billing record?')) {
        try {
            const response = await fetch(`${API_URL}/billing/${billId}`, { method: 'DELETE' });
            if (response.ok) {
                loadBilling();
                alert('Billing record deleted successfully');
            }
        } catch(err) {
            alert('Error deleting billing record');
        }
    }
}

// Utility Functions
function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}
