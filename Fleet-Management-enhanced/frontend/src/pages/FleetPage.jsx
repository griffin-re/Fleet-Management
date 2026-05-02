import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from './../components/Layout';
import {
  Card, Button, Input, Modal, Spinner, LoadingState, EmptyState,
  ErrorState, Pagination, Badge, Select,
} from '../components/UI';
import { useVehicleStore } from '../store';
import { vehicleService } from '../services/api';
import { Plus, Edit2, Trash2, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';

const VALID_STATUSES = ['active', 'idle', 'maintenance', 'deployed'];

const statusBadges = {
  active: 'active',
  idle: 'idle',
  maintenance: 'maintenance',
  deployed: 'deployed',
};

export const FleetPage = () => {
  const navigate = useNavigate();
  const { vehicles, loading, setVehicles, setLoading } = useVehicleStore();
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editVehicle, setEditVehicle] = useState(null);
  const [filters, setFilters] = useState({ status: '', region: '' });
  const [loadError, setLoadError] = useState(null);

  const loadVehicles = useCallback(async () => {
    try {
      setLoadError(null);
      setLoading(true);
      // FIXED: omit empty filter keys so backend doesn't filter on blank strings
      const activeFilters = Object.fromEntries(
        Object.entries(filters).filter(([, v]) => v !== '')
      );
      const response = await vehicleService.getAll(page, 20, activeFilters);
      setVehicles(response.data?.data || []);
      setTotalPages(response.data?.pagination?.totalPages || 1);
    } catch (error) {
      setLoadError('Failed to load vehicles');
      toast.error('Failed to load vehicles');
    } finally {
      setLoading(false);
    }
  }, [page, filters, setVehicles, setLoading]);

  useEffect(() => {
    loadVehicles();
  }, [loadVehicles]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this vehicle? This action cannot be undone.')) return;
    try {
      await vehicleService.delete(id);
      toast.success('Vehicle deleted');
      loadVehicles();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to delete vehicle');
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1); // FIXED: reset to page 1 on filter change
  };

  if (loadError && vehicles.length === 0) {
    return (
      <Layout>
        <ErrorState message={loadError} onRetry={loadVehicles} />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-bold font-rajdhani text-amber-400">Fleet Management</h1>
            <p className="text-slate-400">Total: {vehicles.length} vehicles</p>
          </div>
          <Button variant="primary" onClick={() => setShowAddModal(true)}>
            <Plus className="w-4 h-4" />
            Add Vehicle
          </Button>
        </div>

        {/* Filters */}
        <Card className="flex gap-4 flex-wrap">
          <Input
            placeholder="Search vehicles..."
            className="flex-1 min-w-[200px]"
            onChange={(e) => handleFilterChange('search', e.target.value)}
          />
          {/* FIXED: Use Select component from UI.jsx for consistent styling */}
          <Select
            className="min-w-[150px]"
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
          >
            <option value="">All Status</option>
            {VALID_STATUSES.map(s => (
              <option key={s} value={s} className="capitalize">{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </Select>
          <Input
            placeholder="Filter by region..."
            className="min-w-[150px]"
            value={filters.region}
            onChange={(e) => handleFilterChange('region', e.target.value)}
          />
        </Card>

        {/* Table */}
        {loading ? (
          <LoadingState />
        ) : vehicles.length === 0 ? (
          <EmptyState
            icon={null}
            title="No Vehicles"
            description="Start by adding your first vehicle to the fleet"
            action={<Button onClick={() => setShowAddModal(true)}>Add Vehicle</Button>}
          />
        ) : (
          <>
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="table w-full">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Registration</th>
                      <th>Type</th>
                      <th>Status</th>
                      <th>Region</th>
                      <th>Last Ping</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vehicles.map((vehicle) => (
                      <tr key={vehicle.id}>
                        <td>
                          <span className="font-mono text-amber-400 text-xs">{vehicle.id.slice(0, 8)}</span>
                        </td>
                        <td className="font-medium">{vehicle.registration}</td>
                        <td>{vehicle.type}</td>
                        <td>
                          <Badge variant={statusBadges[vehicle.status] || 'default'}>
                            {vehicle.status}
                          </Badge>
                        </td>
                        <td>{vehicle.region}</td>
                        <td className="text-slate-400 text-sm">
                          {/* FIXED: Guard null last_ping (snake_case from PostgreSQL) */}
                          {vehicle.last_ping
                            ? new Date(vehicle.last_ping).toLocaleString()
                            : 'Never'}
                        </td>
                        <td>
                          <div className="flex gap-2">
                            <button
                              onClick={() => navigate(`/fleet/${vehicle.id}`)}
                              className="p-1 hover:bg-slate-700 rounded transition-colors text-slate-300 hover:text-white"
                              title="View details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setEditVehicle(vehicle)}
                              className="p-1 hover:bg-slate-700 rounded transition-colors text-slate-300 hover:text-white"
                              title="Edit vehicle"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(vehicle.id)}
                              className="p-1 hover:bg-red-900 text-red-400 rounded transition-colors"
                              title="Delete vehicle"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
            <Pagination page={page} totalPages={totalPages} onChangePage={setPage} />
          </>
        )}

        {/* Add Modal */}
        <VehicleModal
          isOpen={showAddModal}
          onClose={() => {
            setShowAddModal(false);
            loadVehicles();
          }}
        />

        {/* Edit Modal */}
        {editVehicle && (
          <VehicleModal
            isOpen={!!editVehicle}
            vehicle={editVehicle}
            onClose={() => {
              setEditVehicle(null);
              loadVehicles();
            }}
          />
        )}
      </div>
    </Layout>
  );
};

// FIXED: Combined Add + Edit into one modal component
const VehicleModal = ({ isOpen, onClose, vehicle = null }) => {
  const isEdit = !!vehicle;
  const { register, handleSubmit, reset, formState: { isSubmitting, errors } } = useForm({
    defaultValues: vehicle ? {
      type: vehicle.type,
      registration: vehicle.registration,
      region: vehicle.region,
      capacity: vehicle.capacity,
    } : {},
  });

  const onSubmit = async (data) => {
    try {
      if (isEdit) {
        await vehicleService.update(vehicle.id, data);
        toast.success('Vehicle updated');
      } else {
        await vehicleService.create(data);
        toast.success('Vehicle added');
      }
      reset();
      onClose();
    } catch (error) {
      const msg = error.response?.data?.error || (isEdit ? 'Failed to update vehicle' : 'Failed to add vehicle');
      toast.error(msg);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? 'Edit Vehicle' : 'Add Vehicle'} size="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Vehicle Type"
          {...register('type', { required: 'Vehicle type is required' })}
          error={errors.type?.message}
          required
        />
        <Input
          label="Registration"
          {...register('registration', { required: 'Registration is required' })}
          error={errors.registration?.message}
          required
        />
        <Input
          label="Region"
          {...register('region', { required: 'Region is required' })}
          error={errors.region?.message}
          required
        />
        <Input
          label="Capacity"
          {...register('capacity', { valueAsNumber: true, min: { value: 1, message: 'Must be at least 1' } })}
          error={errors.capacity?.message}
          type="number"
          min="1"
        />
        <div className="flex gap-2 justify-end pt-4">
          <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? <Spinner size="sm" /> : isEdit ? 'Update Vehicle' : 'Add Vehicle'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
