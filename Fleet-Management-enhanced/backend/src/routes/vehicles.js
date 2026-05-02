const express = require('express');
const { authenticate } = require('../middleware/auth');
const vehicleController = require('../controllers/vehicleController');

const router = express.Router();

router.get('/', authenticate, vehicleController.getAll);
router.post('/', authenticate, vehicleController.create);
router.get('/:id', authenticate, vehicleController.getById);
router.put('/:id', authenticate, vehicleController.update);
router.patch('/:id/status', authenticate, vehicleController.updateStatus);
router.delete('/:id', authenticate, vehicleController.deleteVehicle);
router.get('/:id/history', authenticate, vehicleController.getHistory);

module.exports = router;
