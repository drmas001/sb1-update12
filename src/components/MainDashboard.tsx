import React, { useState, useEffect } from 'react';
import { Users, Activity, Clipboard, ArrowRight, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';

interface SpecialtyStats {
  specialty: string;
  activePatients: number;
  totalPatients: number;
}

interface User {
  id: string;
  employeeCode: string;
  isAdmin: boolean;
  name: string;
}

interface MainDashboardProps {
  user: User;
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

const MainDashboard: React.FC<MainDashboardProps> = ({ user }) => {
  const [totalPatients, setTotalPatients] = useState<number>(0);
  const [activePatients, setActivePatients] = useState<number>(0);
  const [specialtyStats, setSpecialtyStats] = useState<SpecialtyStats[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch total patients
      const { count: totalCount, error: totalError } = await supabase
        .from('patients')
        .select('*', { count: 'exact', head: true });

      if (totalError) throw totalError;
      setTotalPatients(totalCount || 0);

      // Fetch active patients and recently discharged patients
      const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
      const { count: activeCount, error: activeError } = await supabase
        .from('patients')
        .select('*', { count: 'exact', head: true })
        .or(`patient_status.eq.Active,and(patient_status.eq.Discharged,updated_at.gte.${fortyEightHoursAgo})`);

      if (activeError) throw activeError;
      setActivePatients(activeCount || 0);

      // Fetch specialty statistics
      const specialtyStatsPromises = specialtiesList.map(async (specialty) => {
        const { count: activeCount, error: activeError } = await supabase
          .from('patients')
          .select('*', { count: 'exact', head: true })
          .eq('specialty', specialty)
          .or(`patient_status.eq.Active,and(patient_status.eq.Discharged,updated_at.gte.${fortyEightHoursAgo})`);

        const { count: totalCount, error: totalError } = await supabase
          .from('patients')
          .select('*', { count: 'exact', head: true })
          .eq('specialty', specialty);

        if (activeError || totalError) throw activeError || totalError;

        return {
          specialty,
          activePatients: activeCount || 0,
          totalPatients: totalCount || 0,
        };
      });

      const stats = await Promise.all(specialtyStatsPromises);
      setSpecialtyStats(stats);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Main Dashboard</h1>
        <div className="flex items-center bg-white rounded-lg shadow px-4 py-2">
          <User className="h-5 w-5 text-gray-500 mr-2" />
          <div>
            <p className="text-sm font-medium text-gray-900">{user.name}</p>
            <p className="text-xs text-gray-500">Code: {user.employeeCode}</p>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-6 w-6 text-gray-400" aria-hidden="true" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Patients</dt>
                  <dd className="text-3xl font-semibold text-gray-900">{totalPatients}</dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <Link to="/specialties" className="font-medium text-indigo-700 hover:text-indigo-900">
                View all<span className="sr-only"> patients</span>
              </Link>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Activity className="h-6 w-6 text-gray-400" aria-hidden="true" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Active Patients</dt>
                  <dd className="text-3xl font-semibold text-gray-900">{activePatients}</dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <Link to="/specialties" className="font-medium text-indigo-700 hover:text-indigo-900">
                View active<span className="sr-only"> patients</span>
              </Link>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Clipboard className="h-6 w-6 text-gray-400" aria-hidden="true" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Daily Report</dt>
                  <dd className="text-lg font-semibold text-gray-900">Generate Report</dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <Link to="/daily-report" className="font-medium text-indigo-700 hover:text-indigo-900">
                Go to Daily Report
              </Link>
            </div>
          </div>
        </div>
      </div>

      <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Specialty Statistics</h2>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {specialtyStats.map((stat) => (
          <div key={stat.specialty} className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">{stat.specialty}</dt>
                    <dd className="mt-1 text-3xl font-semibold text-gray-900">{stat.activePatients}</dd>
                  </dl>
                </div>
              </div>
              <div className="mt-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-500">Active</div>
                  <div className="text-sm font-medium text-indigo-600">{stat.activePatients} / {stat.totalPatients}</div>
                </div>
                <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-indigo-600 h-2 rounded-full"
                    style={{ width: `${(stat.activePatients / stat.totalPatients) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-5 py-3">
              <div className="text-sm">
                <Link to={`/specialties?specialty=${encodeURIComponent(stat.specialty)}`} className="font-medium text-indigo-700 hover:text-indigo-900 flex items-center">
                  View details
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MainDashboard;