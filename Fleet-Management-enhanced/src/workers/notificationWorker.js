const { Worker } = require('bullmq');
const nodemailer = require('nodemailer');
const logger = require('../utils/logger');
const config = require('../config');

const createNotificationWorker = (redisConnection) => {
  // Create transporter if SMTP is configured
  let transporter = null;
  if (config.SMTP_HOST && config.SMTP_USER) {
    transporter = nodemailer.createTransport({
      host: config.SMTP_HOST,
      port: config.SMTP_PORT,
      secure: config.SMTP_PORT === 465,
      auth: {
        user: config.SMTP_USER,
        pass: config.SMTP_PASSWORD,
      },
    });
  }

  const notificationWorker = new Worker('notifications', async (job) => {
    const { vehicle_id, type, message, severity } = job.data;

    try {
      logger.info('Sending notification', { vehicle_id, type, severity });

      if (transporter) {
        // Send email
        const mailOptions = {
          from: config.SMTP_FROM,
          to: 'admin@fleetmanagement.com', // TODO: Get actual email from user or config
          subject: `Fleet Alert: ${type.toUpperCase()} - Vehicle ${vehicle_id}`,
          text: message,
          html: `<p><strong>Alert Type:</strong> ${type}</p>
                 <p><strong>Vehicle ID:</strong> ${vehicle_id}</p>
                 <p><strong>Severity:</strong> ${severity}</p>
                 <p><strong>Message:</strong> ${message}</p>`,
        };

        await transporter.sendMail(mailOptions);
        logger.info('Email notification sent successfully', { vehicle_id, type });
      } else {
        logger.warn('SMTP not configured, skipping email notification', { vehicle_id, type });
      }
    } catch (error) {
      logger.error('Error sending notification', { error: error.message, vehicle_id });
      throw error;
    }
}, {
  connection: redisConnection
});

notificationWorker.on('completed', (job) => {
  logger.info('Notification job completed', { jobId: job.id });
});

notificationWorker.on('failed', (job, err) => {
  logger.error('Notification job failed', { jobId: job.id, error: err.message });
});

  return notificationWorker;
};

module.exports = createNotificationWorker;