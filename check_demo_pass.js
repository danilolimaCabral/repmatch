const bcrypt = require('bcryptjs');
const hash = '$2b$12$U41fjWSOliFSNsB1X63zg.MPjoK.dnr6gxQi6AlTeyCX2WqhhAPVa';
const passwords = ['demo123', 'Demo@2024', 'demo@2024', 'repmatch123', 'admin123', 'Demo123', 'demo@123', 'RepMatch@2024', 'repmatch@2024', '123456', 'demo'];
Promise.all(passwords.map(p => bcrypt.compare(p, hash).then(r => ({p, r})))).then(results => {
  const matches = results.filter(r => r.r);
  if (matches.length > 0) {
    matches.forEach(r => console.log('MATCH:', r.p));
  } else {
    console.log('No match found among tested passwords');
  }
});
