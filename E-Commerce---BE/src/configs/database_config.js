const { Sequelize } = require('sequelize');
require('dotenv').config();

// 1. Khởi tạo kết nối với PostgreSQL thông qua Sequelize
const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT || 5432,
        // Chỉ giữ lại 1 dòng dialect lấy từ file .env, nếu không có thì mặc định là 'postgres'
        dialect: process.env.DB_DIALECT || 'postgres', 
        logging: false, 
        pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000
        }
    }
);

// 2. Hàm kiểm tra kết nối (Test connection)
const connectDB = async () => {
    try {
        await sequelize.authenticate();
        console.log('Kết nối với PostgreSQL qua Sequelize thành công!');
    } catch (error) {
        console.error('Không thể kết nối tới database:', error);
    }
};

connectDB();

// 3. Khởi tạo object db để chứa tất cả các models sau này
const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

// Nơi đây sau này bạn sẽ import các models vào. Ví dụ:
// db.User = require('./user_model')(sequelize, Sequelize);
// db.Product = require('./product_model')(sequelize, Sequelize);

// Định nghĩa các mối quan hệ (Associations) ở đây nếu có
// Ví dụ: db.User.hasMany(db.Order);

module.exports = db;