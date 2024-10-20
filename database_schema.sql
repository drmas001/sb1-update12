-- Users Table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_code VARCHAR(50) UNIQUE NOT NULL,
    employee_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'authenticated_user')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Patients Table
CREATE TABLE patients (
    mrn VARCHAR(50) PRIMARY KEY,
    patient_name VARCHAR(100) NOT NULL,
    age INTEGER NOT NULL,
    gender VARCHAR(10) NOT NULL,
    admission_date DATE NOT NULL,
    admission_time TIME NOT NULL,
    discharge_date DATE,
    discharge_time TIME,
    patient_status VARCHAR(20) NOT NULL CHECK (patient_status IN ('Active', 'Discharged')),
    assigned_doctor VARCHAR(100) NOT NULL,
    specialty VARCHAR(100) NOT NULL,
    diagnosis TEXT NOT NULL,
    discharge_note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Visits Table
CREATE TABLE visits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mrn VARCHAR(50) REFERENCES patients(mrn),
    admission_date DATE NOT NULL,
    admission_time TIME NOT NULL,
    discharge_date DATE,
    discharge_time TIME,
    patient_status VARCHAR(20) NOT NULL CHECK (patient_status IN ('Active', 'Discharged')),
    specialty VARCHAR(100) NOT NULL,
    assigned_doctor VARCHAR(100) NOT NULL,
    diagnosis TEXT NOT NULL,
    discharge_note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Patient Notes Table
CREATE TABLE patient_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mrn VARCHAR(50) REFERENCES patients(mrn),
    content TEXT NOT NULL,
    created_by VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Daily Reports Table
CREATE TABLE daily_reports (
    report_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id VARCHAR(50) REFERENCES patients(mrn),
    report_date DATE NOT NULL,
    report_content TEXT NOT NULL,
    created_by VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for improved query performance
CREATE INDEX idx_patients_admission_date ON patients(admission_date);
CREATE INDEX idx_patients_specialty ON patients(specialty);
CREATE INDEX idx_patients_patient_status ON patients(patient_status);
CREATE INDEX idx_visits_admission_date ON visits(admission_date);
CREATE INDEX idx_visits_patient_status ON visits(patient_status);
CREATE INDEX idx_patient_notes_mrn ON patient_notes(mrn);
CREATE INDEX idx_daily_reports_report_date ON daily_reports(report_date);