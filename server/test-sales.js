const adminService = require('./src/services/admin.service');
adminService.getSalesData().then(console.log).catch(console.error);
