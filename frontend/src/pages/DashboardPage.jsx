import React, { useEffect, useState } from 'react';
import { Layout, Card, Button, Spinner, LoadingState, EmptyState } from '../components/UI';
import { useConvoyStore, useVehicleStore, useAlertStore } from '../store';
import { convoyService, vehicleService, alertService } from '../services/api';
import {
  BarChart3,
  Truck,
  AlertTriangle,
  Users,
  TrendingUp,
  Plus,
  ArrowRight,
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import toast from 'react-hot-toast';

const KPICard = ({ icon: Icon, label, value, trend, color = 'amber' }) => (
  <Card className="hover:border-amber-500 transition-all">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-slate-400 text-sm mb-1">{label}</p>
        <p className={`text-3xl font-bold font-rajdhani text-${color}-400`}>{value}</p>
        {trend && (
          <p className={`text-xs mt-2 ${trend > 0 ? 'text-green-400' : 'text-red-400'}`}>
            {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}% from last week
          </p>
        )}
      </div>
      <div className={`p-3 bg-${color}-500/20 rounded-lg`}>
        <Icon className={`w-6 h-6 text-${color}-400`} />
      </div>
    </div>
  </Card>
);

export const DashboardPage = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    activeConvoys: 0,
    fleetAvailable: 0,
    incidents: 0,
    maintenance: 0,
  });
  const [events, setEvents] = useState([]);
  const [convoyStatusData, setConvoyStatusData] = useState([]);
  const { convoys, setConvoys } = useConvoyStore();
  const { vehicles, setVehicles } = useVehicleStore();

  useEffect(() => {
    loadDashboard();
    // Refresh every 30 seconds
    const interval = setInterval(loadDashboard, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const [convoysRes, vehiclesRes] = await Promise.all([
        convoyService.getAll(1, 100),
        vehicleService.getAll(1, 100),
      ]);

      const convoyList = convoysRes.data.data || [];
      const vehicleList = vehiclesRes.data.data || [];

      setConvoys(convoyList);
      setVehicles(vehicleList);

      // Calculate KPIs
      const activeConvoys = convoyList.filter(c => c.status === 'active').length;
      const fleetAvailable = vehicleList.filter(v => v.status === 'idle').length;
      const maintenance = vehicleList.filter(v => v.status === 'maintenance').length;

      setStats({
        activeConvoys,
        fleetAvailable,
        incidents: 0,
        maintenance,
      });

      // Prepare convoy status data for chart
      const statusCounts = {
        active: activeConvoys,
        planned: convoyList.filter(c => c.status === 'planned').length,
        completed: convoyList.filter(c => c.status === 'completed').length,
      };

      setConvoyStatusData(
        Object.entries(statusCounts).map(([name, value]) => ({
          name: name.charAt(0).toUpperCase() + name.slice(1),
          value,
          fill: {
            active: '#3B82F6',
            planned: '#F59E0B',
            completed: '#10B981',
          }[name],
        }))
      );

      // Mock events
      setEvents(
        convoyList.slice(0, 5).map(c => ({
          id: c.id,
          message: `Convoy ${c.id} - ${c.status}`,
          timestamp: c.createdAt,
          type: 'convoy',
        }))
      );
    } catch (error) {
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <Layout>
      <LoadingState />
    </Layout>
  );

  return (
    <Layout>
      <div className="space-y-6">
        {/* Title */}
        <div>
          <h1 className="text-4xl font-bold font-rajdhani text-amber-400 mb-2">
            Tactical Operations Center
          </h1>
          <p className="text-slate-400">Real-time fleet monitoring and control</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            icon={Truck}
            label="Active Convoys"
            value={stats.activeConvoys}
            trend={12}
            color="blue"
          />
          <KPICard
            icon={Users}
            label="Fleet Available"
            value={stats.fleetAvailable}
            trend={5}
            color="green"
          />
          <KPICard
            icon={AlertTriangle}
            label="Incidents Today"
            value={stats.incidents}
            trend={-8}
            color="red"
          />
          <KPICard
            icon={BarChart3}
            label="In Maintenance"
            value={stats.maintenance}
            trend={3}
            color="amber"
          />
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols- lg:grid-cols-3 gap-6">
          {/* Convoy Status */}
          <Card>
            <h2 className="text-lg font-bold font-rajdhani text-amber-400 mb-4">Convoy Status</h2>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={convoyStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  dataKey="value"
                  labelLine={false}
                >
                  {convoyStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#161B22',
                    border: '1px solid #30363D',
                    borderRadius: '8px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {convoyStatusData.map((item) => (
                <div key={item.name} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.fill }} />
                    {item.name}
                  </span>
                  <span className="font-mono font-bold">{item.value}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Recent Activity */}
          <Card className="lg:col-span-2">
            <h2 className="text-lg font-bold font-rajdhani text-amber-400 mb-4">Recent Activity</h2>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {events.length === 0 ? (
                <EmptyState
                  title="No Activity"
                  description="Real-time events will appear here"
                />
              ) : (
                events.map((event) => (
                  <div key={event.id} className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg border border-slate-700 hover:border-amber-500 transition-colors">
                    <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-300 truncate">{event.message}</p>
                      <p className="text-xs text-slate-500">
                        {new Date(event.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-600" />
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <h2 className="text-lg font-bold font-rajdhani text-amber-400 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Button variant="primary" className="gap-2">
              <Plus className="w-4 h-4" />
              Create Convoy
            </Button>
            <Button variant="secondary" className="gap-2">
              <Truck className="w-4 h-4" />
              Dispatch Vehicle
            </Button>
            <Button variant="secondary" className="gap-2">
              <AlertTriangle className="w-4 h-4" />
              Report Incident
            </Button>
          </div>
        </Card>
      </div>
    </Layout>
  );
};
