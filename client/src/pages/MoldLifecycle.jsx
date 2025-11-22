import { useState, useEffect } from 'react';
import { CheckCircle, Clock, AlertCircle, Filter, Search, Check } from 'lucide-react';

export default function MoldLifecycle() {
  const [molds, setMolds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCarModel, setSelectedCarModel] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadMolds();
  }, []);

  const loadMolds = async () => {
    try {
      setLoading(true);
      const mockData = [
        {
          id: 1,
          mold_code: 'M-2024-001',
          part_number: 'P-2024-001',
          part_name: 'Bumper Cover LH',
          car_model: 'K5',
          car_year: '2024',
          maker_name: 'A Maker',
          schedule: {
            design: { start: '2024-01-15', end: '2024-02-15', progress: 100, status: 'completed' },
            manufacturing: { start: '2024-02-20', end: '2024-05-30', progress: 100, status: 'completed' },
            assembly: { start: '2024-06-01', end: '2024-06-20', progress: 100, status: 'completed' },
            trial: { start: '2024-06-25', end: '2024-07-15', progress: 100, status: 'completed' },
            delivery: { date: '2024-07-20', status: 'completed' }
          },
          overall_progress: 100,
          is_delayed: false,
          delay_days: 0
        },
        {
          id: 2,
          mold_code: 'M-2024-002',
          part_number: 'P-2024-002',
          part_name: 'Door Trim LH',
          car_model: 'K8',
          car_year: '2024',
          maker_name: 'A Maker',
          schedule: {
            design: { start: '2024-03-01', end: '2024-03-25', progress: 100, status: 'completed' },
            manufacturing: { start: '2024-04-01', end: '2024-07-15', progress: 65, status: 'in_progress' },
            assembly: { start: '2024-07-20', end: '2024-08-10', progress: 0, status: 'pending' },
            trial: { start: '2024-08-15', end: '2024-09-05', progress: 0, status: 'pending' },
            delivery: { date: '2024-09-10', status: 'pending' }
          },
          overall_progress: 45,
          is_delayed: true,
          delay_days: 5
        }
      ];
      setMolds(mockData);
    } catch (error) {
      console.error('Failed to load molds:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredMolds = molds.filter(mold => {
    const matchesCarModel = selectedCarModel === 'all' || mold.car_model === selectedCarModel;
    const matchesSearch = 
      mold.mold_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mold.part_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mold.part_number.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCarModel && matchesSearch;
  });

  const carModels = ['all', ...new Set(molds.map(m => m.car_model))];

  const stats = {
    total: molds.length,
    completed: molds.filter(m => m.overall_progress === 100).length,
    inProgress: molds.filter(m => m.overall_progress > 0 && m.overall_progress < 100).length,
    delayed: molds.filter(m => m.is_delayed).length,
    avgProgress: Math.round(molds.reduce((sum, m) => sum + m.overall_progress, 0) / molds.length) || 0
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
          <CheckCircle size={12} className="mr-1" /> Complete
        </span>;
      case 'in_progress':
        return <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
          <Clock size={12} className="mr-1" /> In Progress
        </span>;
      case 'pending':
        return <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-600">
          <Clock size={12} className="mr-1" /> Pending
        </span>;
      default:
        return null;
    }
  };

  const getProgressColor = (progress) => {
    if (progress === 100) return 'bg-green-600';
    if (progress >= 70) return 'bg-blue-600';
    if (progress >= 40) return 'bg-yellow-600';
    return 'bg-orange-600';
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Development Progress</h1>
        <p className="text-sm text-gray-600 mt-1">
          Track mold development progress by car model and item
        </p>
      </div>

      <div className="grid grid-cols-5 gap-4 mb-6">
        <div className="card bg-gradient-to-br from-blue-50 to-blue-100">
          <div className="text-center">
            <p className="text-sm text-blue-600 font-medium">Total</p>
            <p className="text-3xl font-bold text-blue-900 mt-1">{stats.total}</p>
          </div>
        </div>
        <div className="card bg-gradient-to-br from-green-50 to-green-100">
          <div className="text-center">
            <p className="text-sm text-green-600 font-medium">Completed</p>
            <p className="text-3xl font-bold text-green-900 mt-1">{stats.completed}</p>
          </div>
        </div>
        <div className="card bg-gradient-to-br from-orange-50 to-orange-100">
          <div className="text-center">
            <p className="text-sm text-orange-600 font-medium">In Progress</p>
            <p className="text-3xl font-bold text-orange-900 mt-1">{stats.inProgress}</p>
          </div>
        </div>
        <div className="card bg-gradient-to-br from-red-50 to-red-100">
          <div className="text-center">
            <p className="text-sm text-red-600 font-medium">Delayed</p>
            <p className="text-3xl font-bold text-red-900 mt-1">{stats.delayed}</p>
          </div>
        </div>
        <div className="card bg-gradient-to-br from-purple-50 to-purple-100">
          <div className="text-center">
            <p className="text-sm text-purple-600 font-medium">Avg Progress</p>
            <p className="text-3xl font-bold text-purple-900 mt-1">{stats.avgProgress}%</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="card text-center py-12">
          <p className="text-gray-500">Loading...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredMolds.map((mold) => (
            <div key={mold.id} className="card">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold">{mold.mold_code}</h3>
                  <p className="text-sm text-gray-600">{mold.part_name} - {mold.car_model}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Progress</p>
                  <p className="text-2xl font-bold text-blue-600">{mold.overall_progress}%</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}