import React, { useState, useEffect } from 'react';
import { Activity, Users, CheckCircle, XCircle, Search, ArrowUpDown, Calendar, Filter, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { toast } from 'react-toastify';

interface Patient {
  mrn: string;
  patient_name: string;
  admission_date: string;
  discharge_date: string | null;
  patient_status: 'Active' | 'Discharged';
  specialty: string;
  diagnosis: string;
  updated_at: string;
}

interface SpecialtyData {
  specialty: string;
  patients: Patient[];
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

const SpecialtiesManagement: React.FC = () => {
  const [specialtiesData, setSpecialtiesData] = useState<SpecialtyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'ascending' | 'descending' } | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('');

  useEffect(() => {
    fetchSpecialtiesData();
  }, []);

  const fetchSpecialtiesData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
      
      const { data, error } = await supabase
        .from('patients')
        .select(`
          mrn,
          patient_name,
          admission_date,
          discharge_date,
          patient_status,
          specialty,
          diagnosis,
          updated_at
        `)
        .or(`patient_status.eq.Active,and(patient_status.eq.Discharged,updated_at.gte.${fortyEightHoursAgo})`)
        .order('admission_date', { ascending: false });

      if (error) {
        console.error('Supabase query error:', error);
        throw new Error('Failed to fetch data from Supabase');
      }

      console.log('Fetched data:', data); // Log the fetched data

      if (!data || data.length === 0) {
        setSpecialtiesData([]);
        setLoading(false);
        return;
      }

      const groupedData = specialtiesList.map(specialty => ({
        specialty,
        patients: data
          .filter(patient => patient.specialty === specialty)
          .map(patient => ({
            ...patient,
            admission_date: new Date(patient.admission_date).toLocaleDateString(),
            discharge_date: patient.discharge_date ? new Date(patient.discharge_date).toLocaleDateString() : null,
          }))
      }));

      setSpecialtiesData(groupedData);
    } catch (error) {
      console.error('Error in fetchSpecialtiesData:', error);
      setError('Failed to fetch specialties data');
      toast.error('Failed to fetch specialties data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (key: string) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const sortedData = (patients: Patient[]) => {
    if (!sortConfig) return patients;
    return [...patients].sort((a, b) => {
      if (a[sortConfig.key as keyof Patient] < b[sortConfig.key as keyof Patient]) {
        return sortConfig.direction === 'ascending' ? -1 : 1;
      }
      if (a[sortConfig.key as keyof Patient] > b[sortConfig.key as keyof Patient]) {
        return sortConfig.direction === 'ascending' ? 1 : -1;
      }
      return 0;
    });
  };

  const filteredData = specialtiesData
    .filter(specialty => selectedSpecialty ? specialty.specialty === selectedSpecialty : true)
    .map(specialty => ({
      ...specialty,
      patients: specialty.patients.filter(patient =>
        (patient.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
         patient.mrn.includes(searchTerm)) &&
        (selectedDate ? patient.admission_date === selectedDate : true)
      )
    }));

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Specialties Management</h1>
      
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-betweensm:justify-between">
        <div className="flex items-center mb-2 sm:mb-0">
          <div className="relative rounded-md shadow-sm mr-2">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
              placeholder="Search patients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="relative rounded-md shadow-sm mr-2">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Calendar className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="date"
              className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>
          <div className="relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Filter className="h-5 w-5 text-gray-400" />
            </div>
            <select
              className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 pr-10 py-2 text-base border-gray-300 sm:text-sm rounded-md"
              value={selectedSpecialty}
              onChange={(e) => setSelectedSpecialty(e.target.value)}
            >
              <option value="">All Specialties</option>
              {specialtiesList.map((specialty) => (
                <option key={specialty} value={specialty}>{specialty}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {filteredData.map((specialty) => (
        <div key={specialty.specialty} className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
          <div className="px-4 py-5 sm:px-6">
            <h2 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
              <Activity className="h-5 w-5 mr-2 text-indigo-500" />
              {specialty.specialty}
            </h2>
          </div>
          {specialty.patients.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <button onClick={() => handleSort('patient_name')} className="flex items-center">
                        Patient Name
                        <ArrowUpDown className="h-4 w-4 ml-1" />
                      </button>
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <button onClick={() => handleSort('mrn')} className="flex items-center">
                        MRN
                        <ArrowUpDown className="h-4 w-4 ml-1" />
                      </button>
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <button onClick={() => handleSort('admission_date')} className="flex items-center">
                        Admission Date
                        <ArrowUpDown className="h-4 w-4 ml-1" />
                      </button>
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <button onClick={() => handleSort('discharge_date')} className="flex items-center">
                        Discharge Date
                        <ArrowUpDown className="h-4 w-4 ml-1" />
                      </button>
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <button onClick={() => handleSort('diagnosis')} className="flex items-center">
                        Diagnosis
                        <ArrowUpDown className="h-4 w-4 ml-1" />
                      </button>
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sortedData(specialty.patients).map((patient) => (
                    <tr key={patient.mrn}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{patient.patient_name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{patient.mrn}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{patient.admission_date}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{patient.discharge_date || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          patient.patient_status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {patient.patient_status === 'Active' ? (
                            <CheckCircle className="h-4 w-4 mr-1" />
                          ) : (
                            <XCircle className="h-4 w-4 mr-1" />
                          )}
                          {patient.patient_status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{patient.diagnosis}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Link
                          to={`/patient/${patient.mrn}`}
                          className="text-indigo-600 hover:text-indigo-900 flex items-center"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View Details
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="px-4 py-5 sm:px-6 text-gray-500">No patients in this specialty</div>
          )}
        </div>
      ))}
    </div>
  );
};

export default SpecialtiesManagement;