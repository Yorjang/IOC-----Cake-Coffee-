const fs = require('fs');
const file = 'src/app/components/AdminPanel.tsx';
let code = fs.readFileSync(file, 'utf8');

// Replace await res.json() with unwrap logic
code = code.replace(/await (\w+)\.json\(\)/g, 'await $1.json().then(d => (d && d.data !== undefined && d.data !== null) ? d.data : d)');

// Also fix the destructuring in Dashboard just in case
code = code.replace(
  'const { stats, weekly, recentOrders } = data;',
  'const { stats = [], weekly = [], recentOrders = [] } = data || {};'
);

fs.writeFileSync(file, code);
console.log('Fixed AdminPanel.tsx successfully.');
