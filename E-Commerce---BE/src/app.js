const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt")

const app = express();

// --- Cấu hình Middleware ---
app.use(cors());
// Hỗ trợ đọc dữ liệu JSON gửi lên từ client
app.use(express.json()); 
// Hỗ trợ đọc dữ liệu từ form (URL-encoded)
app.use(express.urlencoded({ extended: true }));

// --- Tạo một Route test cơ bản ---
app.get("/", (req, res) => {
    res.json({ message: "Chào mừng đến với API Backend E-Commerce!" });
});

// Sau này bạn sẽ import các file router từ thư mục 'routes' vào đây
// Ví dụ: app.use('/api', require('./routes'));

// Quan trọng: Export cái app này ra để file server.js có thể sử dụng
module.exports = app;