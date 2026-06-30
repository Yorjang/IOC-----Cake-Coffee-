// Load các biến môi trường từ file .env
require('dotenv').config();

// Import file app (Express) và thư mục models (Database)
const app = require('./src/app');
const db = require('./src/configs/database_config'); 

// Lấy PORT từ file .env, nếu không có thì mặc định dùng cổng 8080
const PORT = process.env.PORT || 8080;

// Yêu cầu server bắt đầu "lắng nghe" các kết nối
app.listen(PORT, () => {
    console.log(`Server is running at port ${PORT}.`);
    console.log(`You can asset at: http://localhost:${PORT}`);
});