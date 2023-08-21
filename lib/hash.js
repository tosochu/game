const { pbkdf2Sync } = require('crypto');
module.exports = function (password, salt) {
  return pbkdf2Sync(password, salt, 100000, 64, 'sha256').toString('hex').substring(0, 64);
}