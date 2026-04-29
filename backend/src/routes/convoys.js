const express = require('express');
const { authenticate } = require('../middleware/auth');
const convoyController = require('../controllers/convoyController');

const router = express.Router();

router.get('/', authenticate, convoyController.getAll);
router.post('/', authenticate, convoyController.create);
router.get('/:id', authenticate, convoyController.getById);
router.put('/:id', authenticate, convoyController.update);
router.patch('/:id/status', authenticate, convoyController.updateStatus);
router.post('/:id/assign', authenticate, convoyController.assign);
router.delete('/:id', authenticate, convoyController.deleteConvoy);
router.get('/:id/events', authenticate, convoyController.getEvents);

module.exports = router;
