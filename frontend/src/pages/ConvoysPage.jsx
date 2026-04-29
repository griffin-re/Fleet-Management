import React, { useEffect, useState } from 'react';
import { Layout, Card, Button, Spinner, LoadingState, EmptyState, Badge, Modal, Input, Textarea } from '../components/UI';
import { useConvoyStore } from '../store';
import { convoyService } from '../services/api';
import { Plus, MapPin, Users, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';

const statusBadges = {
  planned: 'default',
  active: 'active',
  completed: 'completed',
  archived: 'idle',
};

export const ConvoysPage = () => {
  const { convoys, loading, setConvoys, setLoading } = useConvoyStore();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('all');

  useEffect(() => {
    loadConvoys();
  }, []);

  const loadConvoys = async () => {
    try {
      setLoading(true);
      const response = await convoyService.getAll(1, 100);
      setConvoys(response.data.data || []);
    } catch (error) {
      toast.error('Failed to load convoys');
    } finally {
      setLoading(false);
    }
  };

  const filteredConvoys = selectedStatus === 'all'
    ? convoys
    : convoys.filter(c => c.status === selectedStatus);

  const statuses = ['planned', 'active', 'completed', 'archived'];

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold font-rajdhani text-amber-400">Convoy Operations</h1>
            <p className="text-slate-400">Manage and track active missions</p>
          </div>
          <Button variant="primary" onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4" />
            Create Convoy
          </Button>
        </div>

        {/* Status Pipeline */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {statuses.map((status) => {
            const count = convoys.filter(c => c.status === status).length;
            return (
              <button
                key={status}
                onClick={() => setSelectedStatus(status)}
                className={`p-4 rounded-lg border-2 transition-all ${
                  selectedStatus === status
                    ? 'border-amber-500 bg-amber-500/10'
                    : 'border-slate-700 hover:border-slate-600'
                }`}
              >
                <p className="text-sm text-slate-400 capitalize">{status}</p>
                <p className="text-2xl font-bold font-rajdhani text-amber-400">{count}</p>
              </button>
            );
          })}
          <button
            onClick={() => setSelectedStatus('all')}
            className={`p-4 rounded-lg border-2 transition-all ${
              selectedStatus === 'all'
                ? 'border-blue-500 bg-blue-500/10'
                : 'border-slate-700 hover:border-slate-600'
            }`}
          >
            <p className="text-sm text-slate-400">Total</p>
            <p className="text-2xl font-bold font-rajdhani text-blue-400">{convoys.length}</p>
          </button>
        </div>

        {/* Convoys List */}
        {loading ? (
          <LoadingState />
        ) : filteredConvoys.length === 0 ? (
          <EmptyState
            icon={MapPin}
            title="No Convoys"
            description={`No ${selectedStatus} convoys at this time`}
            action={<Button onClick={() => setShowCreateModal(true)}>Create Convoy</Button>}
          />
        ) : (
          <div className="grid gap-4">
            {filteredConvoys.map((convoy) => (
              <Card key={convoy.id} className="hover:border-amber-500 transition-all">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold font-rajdhani text-amber-400">{convoy.name}</h3>
                      <Badge variant={statusBadges[convoy.status]}>
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
                        <p className="text-slate-200">{convoy.vehicleCount || 0}</p>
                      </div>
                      <div>
                        <p className="text-slate-500">Priority</p>
                        <p className="text-slate-200 capitalize">{convoy.priority}</p>
                      </div>
                      <div>
                        <p className="text-slate-500">Departure</p>
                        <p className="text-slate-200">{new Date(convoy.departureTime).toLocaleDateString()}</p>
                      </div>
                    </div>
                    {convoy.description && (
                      <p className="mt-3 text-slate-400 text-sm">{convoy.description}</p>
                    )}
                  </div>
                  <Button variant="ghost" size="sm" className="ml-4">
                    View
                  </Button>
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
      </div>
    </Layout>
  );
};

const CreateConvoyModal = ({ isOpen, onClose }) => {
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm();

  const onSubmit = async (data) => {
    try {
      await convoyService.create(data);
      toast.success('Convoy created');
      reset();
      onClose();
    } catch (error) {
      toast.error('Failed to create convoy');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Convoy" size="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input label="Mission Name" {...register('name')} required />
        <Input label="Region" {...register('region')} required />
        <select className="input" {...register('priority')}>
          <option value="low">Low Priority</option>
          <option value="medium">Medium Priority</option>
          <option value="high">High Priority</option>
          <option value="critical">Critical Priority</option>
        </select>
        <Textarea label="Description" {...register('description')} />
        <Input label="Departure Time" type="datetime-local" {...register('departureTime')} />
        <div className="flex gap-2 justify-end pt-4">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? <Spinner size="sm" /> : 'Create Convoy'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
