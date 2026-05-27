const app = require('./src/app');
const PORT = process.env.PORT || 8001;

app.listen(PORT, () => {
  console.log(`[OK] Server API Backend đang chạy tại http://localhost:${PORT}`);
});