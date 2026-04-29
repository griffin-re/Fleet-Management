const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/dashboard', authenticate, async (req, res) => {
  res.json({
    activeConvoys: 5,
    fleetUtilization: 78,
    incidentRate: 2.3,
    onTimeRate: 94,
  });
});

router.get('/fleet-utilization', authenticate, async (req, res) => {
  res.json([
    { region: 'Kenya', utilized: 23, available: 7 },
    { region: 'DRC', utilized: 18, available: 12 },
    { region: 'Tanzania', utilized: 15, available: 10 },
    { region: 'Mali', utilized: 12, available: 8 },
  ]);
});

router.get('/convoy-metrics', authenticate, async (req, res) => {
  res.json([
    { date: '2024-01-01', completed: 5, onTime: 4, delayed: 1 },
    { date: '2024-01-02', completed: 7, onTime: 6, delayed: 1 },
    { date: '2024-01-03', completed: 4, onTime: 4, delayed: 0 },
  ]);
});

router.get('/incident-heatmap', authenticate, async (req, res) => {
  res.json({
    regions: [
      { name: 'Kenya', incidents: 5, locations: [] },
      { name: 'DRC', incidents: 12, locations: [] },
      { name: 'Tanzania', incidents: 3, locations: [] },
      { name: 'Mali', incidents: 8, locations: [] },
    ],
  });
});

module.exports = router;
