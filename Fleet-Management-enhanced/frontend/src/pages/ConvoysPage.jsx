import React, { useEffect, useState, useCallback } from 'react';
import { Layout } from './../components/Layout';
import {
  Card, Button, Spinner, LoadingState, EmptyState, ErrorState,
  Badge, Modal, Input, Textarea, Select,
} from '../components/UI';
import { useConvoyStore } from '../store';
import { convoyService } from '../services/api';
import { Plus, MapPin, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { formatDate } from '../utils/helpers';

const statusBadges = {
  planned: 'default',
  active: 'active',
  completed: 'completed',
  archived: 'idle',
};

const PRIORITY_COLORS = {
  low: 'text-slate-400',
  medium: 'text-amber-400',
  high: 'text-orange-400',
  critical: 'text-red-400',
};

const STATUS_OPTIONS = ['all', 'planned', 'active', 'completed', 'archived'];

export const ConvoysPage = () => {
  const { convoys, loading, setConvoys, setLoading } = useConvoyStore();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedConvoy, setSelectedConvoy] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [loadError, setLoadError] = useState(null);

  const loadConvoys = useCallback(async () => {
    try {
      setLoadError(null);
      setLoading(true);
      const response = await convoyService.getAll(1, 100);
      setConvoys(response.data?.data || []);
    } catch (error) {
      setLoadError('Failed to load convoys');
      toast.error('Failed to load convoys');
    } finally {
      setLoading(false);
    }
  }, [setConvoys, setLoading]);

  useEffect(() => {
    loadConvoys();
  }, [loadConvoys]);

  const handleStatusChange = async (convoy, newStatus) => {
    try {
      await convoyService.updateStatus(convoy.id, newStatus);
      toast.success(`Convoy status updated to ${newStatus}`);
      loadConvoys();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to update status');
    }
  };

  const handleDelete = async (convoy) => {
    if (!window.confirm(`Delete convoy "${convoy.name}"? This cannot be undone.`)) return;
    try {
      await convoyService.delete(convoy.id);
      toast.success('Convoy deleted');
      setSelectedConvoy(null);
      loadConvoys();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to delete convoy');
    }
  };

  const filteredConvoys = selectedStatus === 'all'
    ? convoys
    : convoys.filter(c => c.status === selectedStatus);

  if (loadError && convoys.length === 0) {
    return <Layout><ErrorState message={loadError} onRetry={loadConvoys} /></Layout>;
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-bold font-rajdhani text-amber-400">Convoy Operations</h1>
            <p className="text-slate-400">Manage and track active missions</p>
          </div>
          <Button variant="primary" onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4" />
            Create Convoy
          </Button>
        </div>

        {/* Status Pipeline — FIXED: added "all" button alongside statuses */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {STATUS_OPTIONS.map((status) => {
            const count = status === 'all'
              ? convoys.length
              : convoys.filter(c => c.status === status).length;
            const isSelected = selectedStatus === status;
            return (
              <button
                key={status}
                onClick={() => setSelectedStatus(status)}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  isSelected
                    ? status === 'all'
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-amber-500 bg-amber-500/10'
                    : 'border-slate-700 hover:border-slate-600'
                }`}
              >
                <p className="text-sm text-slate-400 capitalize">{status}</p>
                <p className={`text-2xl font-bold font-rajdhani ${isSelected && status !== 'all' ? 'text-amber-400' : 'text-blue-400'}`}>
                  {count}
                </p>
              </button>
            );
          })}
        </div>

        {/* Convoys List */}
        {loading ? (
          <LoadingState />
        ) : filteredConvoys.length === 0 ? (
          <EmptyState
            icon={MapPin}
            title="No Convoys"
            description={`No ${selectedStatus === 'all' ? '' : selectedStatus + ' '}convoys at this time`}
            action={<Button onClick={() => setShowCreateModal(true)}>Create Convoy</Button>}
          />
        ) : (
          <div className="grid gap-4">
            {filteredConvoys.map((convoy) => (
              <Card
                key={convoy.id}
                className="hover:border-amber-500 transition-all cursor-pointer"
                onClick={() => setSelectedConvoy(convoy)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <h3 className="text-lg font-bold font-rajdhani text-amber-400">{convoy.name}</h3>
                      <Badge variant={statusBadges[convoy.status] || 'default'}>
                        {convoy.status}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-slate-500">Region</p>
                        <p className="text-slate-200">{convoy.region}</p>
                      </div>
                      <div>
                        <p className="text-slate-500">Vehicles</p>
                        <p className="text-slate-200">{convoy.vehicle_count ?? convoy.vehicleCount ?? 0}</p>
                      </div>
                      <div>
                        <p className="text-slate-500">Priority</p>
                        <p className={`capitalize font-medium ${PRIORITY_COLORS[convoy.priority] || 'text-slate-200'}`}>
                          {convoy.priority}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-500">Departure</p>
                        {/* FIXED: handle both snake_case (departure_time) and camelCase (departureTime) */}
                        <p className="text-slate-200">
                          {convoy.departure_time || convoy.departureTime
                            ? formatDate(convoy.departure_time || convoy.departureTime)
                            : 'TBD'}
                        </p>
                      </div>
                    </div>
                    {convoy.description && (
                      <p className="mt-3 text-slate-400 text-sm line-clamp-2">{convoy.description}</p>
                    )}
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-600 flex-shrink-0 mt-1" />
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Create Modal */}
        <CreateConvoyModal
          isOpen={showCreateModal}
          onClose={() => {
            setShowCreateModal(false);
            loadConvoys();
          }}
        />

        {/* Detail/Actions Modal */}
        {selectedConvoy && (
          <ConvoyDetailModal
            convoy={selectedConvoy}
            onClose={() => setSelectedConvoy(null)}
            onStatusChange={handleStatusChange}
            onDelete={handleDelete}
          />
        )}
      </div>
    </Layout>
  );
};

const CreateConvoyModal = ({ isOpen, onClose }) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting, errors },
  } = useForm({ defaultValues: { priority: 'medium' } });

  const onSubmit = async (data) => {
    try {
      await convoyService.create(data);
      toast.success('Convoy created');
      reset();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to create convoy');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Convoy" size="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Mission Name"
          {...register('name', { required: 'Mission name is required' })}
          error={errors.name?.message}
          required
        />
        <Input
          label="Region"
          {...register('region', { required: 'Region is required' })}
          error={errors.region?.message}
          required
        />
        {/* FIXED: Use Select component for priority */}
        <Select label="Priority" {...register('priority')}>
          <option value="low">Low Priority</option>
          <option value="medium">Medium Priority</option>
          <option value="high">High Priority</option>
          <option value="critical">Critical Priority</option>
        </Select>
        <Textarea label="Description" {...register('description')} rows={3} />
        <Input
          label="Departure Time"
          type="datetime-local"
          {...register('departureTime', { required: 'Departure time is required' })}
          error={errors.departureTime?.message}
          required
        />
        <div className="flex gap-2 justify-end pt-4">
          <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? <Spinner size="sm" /> : 'Create Convoy'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

// FIXED: New detail modal instead of a plain "View" button with no action
const ConvoyDetailModal = ({ convoy, onClose, onStatusChange, onDelete }) => {
  const NEXT_STATUSES = {
    planned: ['active', 'archived'],
    active: ['completed', 'archived'],
    completed: ['archived'],
    archived: [],
  };
  const nextStatuses = NEXT_STATUSES[convoy.status] || [];

  return (
    <Modal isOpen={true} onClose={onClose} title={convoy.name} size="lg">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-slate-500 mb-1">Status</p>
            <Badge variant={statusBadges[convoy.status] || 'default'}>{convoy.status}</Badge>
          </div>
          <div>
            <p className="text-slate-500 mb-1">Priority</p>
            <p className={`font-medium capitalize ${PRIORITY_COLORS[convoy.priority] || ''}`}>{convoy.priority}</p>
          </div>
          <div>
            <p className="text-slate-500 mb-1">Region</p>
            <p className="text-slate-200">{convoy.region}</p>
          </div>
          <div>
            <p className="text-slate-500 mb-1">Departure</p>
            <p className="text-slate-200">
              {convoy.departure_time || convoy.departureTime
                ? formatDate(convoy.departure_time || convoy.departureTime)
                : 'TBD'}
            </p>
          </div>
        </div>
        {convoy.description && (
          <div>
            <p className="text-slate-500 mb-1 text-sm">Description</p>
            <p className="text-slate-300 text-sm">{convoy.description}</p>
          </div>
        )}
        {nextStatuses.length > 0 && (
          <div>
            <p className="text-slate-500 mb-2 text-sm">Change Status</p>
            <div className="flex gap-2 flex-wrap">
              {nextStatuses.map(s => (
                <Button
                  key={s}
                  variant="outline"
                  size="sm"
                  onClick={() => { onStatusChange(convoy, s); onClose(); }}
                >
                  Mark as {s}
                </Button>
              ))}
            </div>
          </div>
        )}
        <div className="flex justify-between pt-4 border-t border-slate-700">
          <Button variant="danger" size="sm" onClick={() => onDelete(convoy)}>
            Delete Convoy
          </Button>
          <Button variant="secondary" onClick={onClose}>Close</Button>
        </div>
      </div>
    </Modal>
  );
};
