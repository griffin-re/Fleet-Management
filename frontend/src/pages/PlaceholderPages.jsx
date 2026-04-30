import React from 'react';
import { Layout } from '../components/Layout';

export const AlertsPage = () => {
  return (
    <Layout>
      <div className="text-center py-12">
        <h1 className="text-3xl font-bold text-amber-400">Alerts & Incidents</h1>
        <p className="text-slate-400 mt-2">Coming soon...</p>
      </div>
    </Layout>
  );
};

export const MessagesPage = () => {
  return (
    <Layout>
      <div className="text-center py-12">
        <h1 className="text-3xl font-bold text-amber-400">Internal Communications</h1>
        <p className="text-slate-400 mt-2">Coming soon...</p>
      </div>
    </Layout>
  );
};

export const AnalyticsPage = () => {
  return (
    <Layout>
      <div className="text-center py-12">
        <h1 className="text-3xl font-bold text-amber-400">Operations Analytics</h1>
        <p className="text-slate-400 mt-2">Coming soon...</p>
      </div>
    </Layout>
  );
};

export const SettingsPage = () => {
  return (
    <Layout>
      <div className="text-center py-12">
        <h1 className="text-3xl font-bold text-amber-400">Settings</h1>
        <p className="text-slate-400 mt-2">Coming soon...</p>
      </div>
    </Layout>
  );
};

export const NotFoundPage = () => {
  return (
    <Layout>
      <div className="text-center py-24">
        <div className="text-8xl mb-4">404</div>
        <h1 className="text-3xl font-bold text-amber-400 mb-2">Page Not Found</h1>
        <p className="text-slate-400">The mission route you're looking for doesn't exist.</p>
      </div>
    </Layout>
  );
};
