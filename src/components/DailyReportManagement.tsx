import React, { useState, useEffect } from 'react';
import { Calendar, Filter, Download, Plus, FileText } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Document, Page, Text, View, StyleSheet, PDFDownloadLink } from '@react-pdf/renderer';

interface Patient {
  mrn: string;
  patient_name: string;
  admission_date: string;
  specialty: string;
  patient_status: string;
  diagnosis: string;
  updated_at: string;
}

interface DailyReport {
  report_id: string;
  patient_id: string;
  report_date: string;
  report_content: string;
}

const specialtiesList = [
  'General Internal Medicine',
  'Respiratory Medicine',
  'Infectious Diseases',
  'Neurology',
  'Gastroenterology',
  'Rheumatology',
  'Hematology',
  'Thrombosis Medicine',
  'Immunology & Allergy',
  'Safety Admission'
];

// Define styles for PDF
const styles = StyleSheet.create({
  page: { padding: 30 },
  title: { fontSize: 24, marginBottom: 20, textAlign: 'center' },
  subtitle: { fontSize: 18, marginBottom: 10 },
  table: { display: 'table', width: 'auto', borderStyle: 'solid', borderWidth: 1, borderRightWidth: 0, borderBottomWidth: 0 },
  tableRow: { margin: 'auto', flexDirection: 'row' },
  tableCol: { width: '20%', borderStyle: 'solid', borderWidth: 1, borderLeftWidth: 0, borderTopWidth: 0 },
  tableCell: { margin: 'auto', marginTop: 5, fontSize: 10 }
});

// PDF Document component
const MyDocument: React.FC<{ patients: Patient[], selectedDate: string, selectedSpecialty: string }> = ({ patients, selectedDate, selectedSpecialty }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <Text style={styles.title}>Daily Patient Report</Text>
      <Text style={styles.subtitle}>Date: {selectedDate}</Text>
      {selectedSpecialty && <Text style={styles.subtitle}>Specialty: {selectedSpecialty}</Text>}
      <View style={styles.table}>
        <View style={styles.tableRow}>
          <View style={styles.tableCol}><Text style={styles.tableCell}>MRN</Text></View>
          <View style={styles.tableCol}><Text style={styles.tableCell}>Patient Name</Text></View>
          <View style={styles.tableCol}><Text style={styles.tableCell}>Specialty</Text></View>
          <View style={styles.tableCol}><Text style={styles.tableCell}>Status</Text></View>
          <View style={styles.tableCol}><Text style={styles.tableCell}>Diagnosis</Text></View>
        </View>
        {patients.map((patient) => (
          <View style={styles.tableRow} key={patient.mrn}>
            <View style={styles.tableCol}><Text style={styles.tableCell}>{patient.mrn}</Text></View>
            <View style={styles.tableCol}><Text style={styles.tableCell}>{patient.patient_name}</Text></View>
            <View style={styles.tableCol}><Text style={styles.tableCell}>{patient.specialty}</Text></View>
            <View style={styles.tableCol}><Text style={styles.tableCell}>{patient.patient_status}</Text></View>
            <View style={styles.tableCol}><Text style={styles.tableCell}>{patient.diagnosis}</Text></View>
          </View>
        ))}
      </View>
    </Page>
  </Document>
);

const DailyReportManagement: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [dailyReports, setDailyReports] = useState<DailyReport[]>([]);

  useEffect(() => {
    fetchPatients();
  }, []);

  useEffect(() => {
    if (selectedDate) {
      fetchDailyReports();
    }
  }, [selectedDate]);

  useEffect(() => {
    filterPatients();
  }, [selectedDate, selectedSpecialty, patients]);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('patients')
        .select(`
          mrn,
          patient_name,
          admission_date,
          specialty,
          patient_status,
          diagnosis,
          updated_at
        `)
        .or(`patient_status.eq.Active,and(patient_status.eq.Discharged,updated_at.gte.${new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()})`)
        .order('admission_date', { ascending: false });

      if (error) throw error;

      setPatients(data);
    } catch (error) {
      console.error('Error fetching patients:', error);
      toast.error('Failed to fetch patients');
    } finally {
      setLoading(false);
    }
  };

  const fetchDailyReports = async () => {
    try {
      const { data, error } = await supabase
        .from('daily_reports')
        .select('*')
        .eq('report_date', selectedDate)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setDailyReports(data);
    } catch (error) {
      console.error('Error fetching daily reports:', error);
      toast.error('Failed to fetch daily reports');
    }
  };

  const filterPatients = () => {
    let filtered = patients.filter((patient) => 
      new Date(patient.admission_date).toISOString().split('T')[0] === selectedDate
    );

    if (selectedSpecialty) {
      filtered = filtered.filter((patient) => patient.specialty === selectedSpecialty);
    }

    setFilteredPatients(filtered);
  };

  const renderDailyReports = () => (
    <div className="mt-8">
      <h2 className="text-xl font-semibold mb-4">Daily Reports</h2>
      {dailyReports.length > 0 ? (
        dailyReports.map((report) => (
          <div key={report.report_id} className="bg-white shadow overflow-hidden sm:rounded-lg mb-4">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Report for Patient ID: {report.patient_id}
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Date: {new Date(report.report_date).toLocaleString()}
              </p>
              <p className="mt-2 text-sm text-gray-900">{report.report_content}</p>
            </div>
          </div>
        ))
      ) : (
        <p>No daily reports for the selected date.</p>
      )}
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <ToastContainer />
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Daily Report Management</h1>
      
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center">
        <div className="flex items-center mb-2 sm:mb-0 sm:mr-4">
          <Calendar className="mr-2 h-5 w-5 text-gray-500" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border-gray-300 rounded-md"
          />
        </div>
        <div className="flex items-center">
          <Filter className="mr-2 h-5 w-5 text-gray-500" />
          <select
            value={selectedSpecialty}
            onChange={(e) => setSelectedSpecialty(e.target.value)}
            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border-gray-300 rounded-md"
          >
            <option value="">All Specialties</option>
            {specialtiesList.map((specialty) => (
              <option key={specialty} value={specialty}>{specialty}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div>Loading...</div>
      ) : (
        <>
          <div className="mt-4">
            <h2 className="text-xl font-semibold mb-2">Patient List</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">MRN</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient Name</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Specialty</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Diagnosis</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredPatients.map((patient) => (
                    <tr key={patient.mrn}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{patient.mrn}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{patient.patient_name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{patient.specialty}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          patient.patient_status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {patient.patient_status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{patient.diagnosis}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-4">
            <PDFDownloadLink
              document={<MyDocument patients={filteredPatients} selectedDate={selectedDate} selectedSpecialty={selectedSpecialty} />}
              fileName={`daily_report_${selectedDate}${selectedSpecialty ? `_${selectedSpecialty}` : ''}.pdf`}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {({ blob, url, loading, error }) =>
                loading ? 'Generating PDF...' : (
                  <>
                    <Download className="mr-2 h-5 w-5" />
                    Download PDF Report
                  </>
                )
              }
            </PDFDownloadLink>
          </div>

          {renderDailyReports()}
        </>
      )}
    </div>
  );
};

export default DailyReportManagement;