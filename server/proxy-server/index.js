const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');
require('dotenv').config();

const app = express();
const PORT = process.env.PROXY_PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Proxy configuration
const nodeServerProxy = createProxyMiddleware({
  target: `http://localhost:${process.env.NODE_PORT || 3001}`,
  changeOrigin: true,
  pathRewrite: {
    '^/api/nodeserver': '', // Remove /api/nodeserver prefix
  },
});

const flaskServerProxy = createProxyMiddleware({
  target: `http://localhost:${process.env.FLASK_PORT || 5000}`,
  changeOrigin: true,
  pathRewrite: {
    '^/api/flaskserver': '', // Remove /api/flaskserver prefix
  },
});

// Route requests to appropriate backend service
app.use('/api/nodeserver', nodeServerProxy);
app.use('/api/flaskserver', flaskServerProxy);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Proxy server running on port ${PORT}`);
}); 