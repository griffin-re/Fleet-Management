const express = require('express');
const { authenticate } = require('../middleware/auth');
const alertController = require('../controllers/alertController');

const router = express.Router();

router.get('/', authenticate, alertController.getAll);
router.post('/', authenticate, alertController.create);
router.get('/:id', authenticate, alertController.getById);
router.patch('/:id/acknowledge', authenticate, alertController.acknowledge);
router.patch('/:id/resolve', authenticate, alertController.resolve);

module.exports = router;
