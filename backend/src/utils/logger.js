module.exports = function logger(msg) {
  console.log(`[${new Date().toISOString()}] ${msg}`);
};
