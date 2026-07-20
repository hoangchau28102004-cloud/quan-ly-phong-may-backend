const db = require('./src/config/db');
const conn = db.promise();
(async () => {
  try {
    const [roles] = await conn.query('SELECT DISTINCT ma_vai_tro FROM nguoi_dung');
    console.log('roles', JSON.stringify(roles));
    const [adminsNum] = await conn.query('SELECT id, ho_ten, ma_vai_tro FROM nguoi_dung WHERE ma_vai_tro = 1');
    console.log('adminsNum', JSON.stringify(adminsNum));
    const [adminsStr] = await conn.query("SELECT id, ho_ten, ma_vai_tro FROM nguoi_dung WHERE ma_vai_tro = '1'");
    console.log('adminsStr', JSON.stringify(adminsStr));
    const [adminsAdmin] = await conn.query("SELECT id, ho_ten, ma_vai_tro FROM nguoi_dung WHERE ma_vai_tro = 'admin'");
    console.log('adminsAdmin', JSON.stringify(adminsAdmin));
    const [users] = await conn.query('SELECT id, ho_ten, ma_vai_tro FROM nguoi_dung LIMIT 20');
    console.log('users', JSON.stringify(users));
    const [notifs] = await conn.query('SELECT id, ma_nguoi_dung, tieu_de, loai_thong_bao, da_doc, created_at, updated_at FROM thong_bao ORDER BY id DESC LIMIT 20');
    console.log('notifs', JSON.stringify(notifs));
    const [schemaUsers] = await conn.query('SHOW COLUMNS FROM nguoi_dung');
    console.log('schemaUsers', JSON.stringify(schemaUsers));
    const [schemaNotifs] = await conn.query('SHOW COLUMNS FROM thong_bao');
    console.log('schemaNotifs', JSON.stringify(schemaNotifs));
  } catch (e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
})();
