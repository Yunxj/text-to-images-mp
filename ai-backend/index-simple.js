const express = require('express');
const app = express();
const port = 9000;

// 中间件
app.use(express.json());
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
        return;
    }
    next();
});

// 健康检查
app.get('/', (req, res) => {
    res.json({ 
        status: 'ok', 
        message: 'AI图像生成服务运行中',
        timestamp: new Date().toISOString()
    });
});

app.get('/health', (req, res) => {
    res.json({ status: 'healthy' });
});

// AI生成接口（模拟）
app.post('/api/ai/generate', (req, res) => {
    res.json({
        success: true,
        imageUrl: 'https://example.com/generated-image.jpg',
        message: '图像生成成功'
    });
});

// 启动服务器
app.listen(port, () => {
    console.log(`服务运行在端口 ${port}`);
});

// 导出app（用于serverless）
module.exports = app; 