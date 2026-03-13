import React, { useState, useEffect } from 'react';
import { Package, Plus, Filter } from 'lucide-react';
import { getAllActivePackages } from '../services/packageService';
import PackageCard from '../components/scheduling/PackageCard';
import TreatmentPackageForm from '../components/scheduling/TreatmentPackageForm';
import Modal from '../components/common/Modal';
import type { TreatmentPackage } from '../types';

const Packages: React.FC = () => {
  const [packages, setPackages] = useState<TreatmentPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'completed' | 'expired'>('active');

  useEffect(() => {
    loadPackages();
  }, []);

  const loadPackages = async () => {
    setLoading(true);
    try {
      // For now, just load active packages
      // TODO: Add filtering for all statuses
      const activePackages = await getAllActivePackages();
      setPackages(activePackages);
    } catch (error) {
      console.error('Error loading packages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePackageCreated = (packageId: string) => {
    setShowCreateForm(false);
    loadPackages();
  };

  const handleScheduleNext = (packageId: string) => {
    // TODO: Implement schedule next session
    console.log('Schedule next session for package:', packageId);
  };

  const handleScheduleRemaining = (packageId: string) => {
    // TODO: Implement schedule remaining sessions
    console.log('Schedule remaining sessions for package:', packageId);
  };

  const handleViewDetails = (packageId: string) => {
    // TODO: Implement view package details
    console.log('View details for package:', packageId);
  };

  const filteredPackages = packages.filter(pkg => {
    if (filterStatus === 'all') return true;
    return pkg.status === filterStatus;
  });

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Package className="text-teal-600" size={32} />
          <h1 className="text-3xl font-bold text-gray-800">Treatment Packages</h1>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2 px-6 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus size={20} />
          Create Package
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-teal-500">
          <p className="text-sm text-gray-600">Total Active</p>
          <p className="text-2xl font-bold text-gray-800">
            {packages.filter(p => p.status === 'active').length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
          <p className="text-sm text-gray-600">Total Sessions</p>
          <p className="text-2xl font-bold text-gray-800">
            {packages.reduce((sum, p) => sum + p.totalSessions, 0)}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
          <p className="text-sm text-gray-600">Completed Sessions</p>
          <p className="text-2xl font-bold text-gray-800">
            {packages.reduce((sum, p) => sum + p.completedSessions, 0)}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-orange-500">
          <p className="text-sm text-gray-600">Remaining Sessions</p>
          <p className="text-2xl font-bold text-gray-800">
            {packages.reduce((sum, p) => sum + p.remainingSessions, 0)}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex items-center gap-3">
          <Filter className="text-gray-600" size={20} />
          <span className="text-sm font-medium text-gray-700">Filter:</span>
          <div className="flex gap-2">
            {(['active', 'completed', 'expired', 'all'] as const).map(status => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  filterStatus === status
                    ? 'bg-teal-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-teal-600 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Loading packages...</p>
        </div>
      )}

      {/* Packages Grid */}
      {!loading && filteredPackages.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPackages.map(pkg => (
            <PackageCard
              key={pkg.id}
              package={pkg}
              onScheduleNext={handleScheduleNext}
              onScheduleRemaining={handleScheduleRemaining}
              onViewDetails={handleViewDetails}
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredPackages.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Package className="mx-auto text-gray-400 mb-4" size={48} />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            No {filterStatus !== 'all' ? filterStatus : ''} packages found
          </h3>
          <p className="text-gray-600 mb-4">
            {filterStatus === 'active' 
              ? 'Create a new treatment package to get started'
              : 'No packages match the selected filter'}
          </p>
          {filterStatus === 'active' && (
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2 px-6 rounded-lg inline-flex items-center gap-2 transition-colors"
            >
              <Plus size={20} />
              Create Your First Package
            </button>
          )}
        </div>
      )}

      {/* Create Package Modal */}
      <Modal isOpen={showCreateForm} onClose={() => setShowCreateForm(false)} title="Create New Package">
        <TreatmentPackageForm
          onSuccess={handlePackageCreated}
          onCancel={() => setShowCreateForm(false)}
        />
      </Modal>
    </div>
  );
};

export default Packages;
