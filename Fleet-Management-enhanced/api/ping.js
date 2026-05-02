module.exports = (req, res) => {
  // Just a status check to ensure the handler is callable
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
};
