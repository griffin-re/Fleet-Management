const Joi = require('joi');

// GPS data validation schema
const gpsDataSchema = Joi.object({
  vehicle_id: Joi.number().integer().positive().required(),
  lat: Joi.number().min(-90).max(90).required(),
  lng: Joi.number().min(-180).max(180).required(),
  speed: Joi.number().min(0).required(),
  timestamp: Joi.date().optional()
});

// Vehicle validation schema
const vehicleSchema = Joi.object({
  plate_number: Joi.string().required(),
  make: Joi.string().optional(),
  model: Joi.string().optional(),
  year: Joi.number().integer().min(1900).max(new Date().getFullYear() + 1).optional()
});

// Convoy validation schema
const convoySchema = Joi.object({
  name: Joi.string().required(),
  start_point_lat: Joi.number().min(-90).max(90).required(),
  start_point_lng: Joi.number().min(-180).max(180).required(),
  end_point_lat: Joi.number().min(-90).max(90).required(),
  end_point_lng: Joi.number().min(-180).max(180).required(),
  risk_level: Joi.string().valid('low', 'medium', 'high').optional()
});

module.exports = {
  gpsDataSchema,
  vehicleSchema,
  convoySchema
};