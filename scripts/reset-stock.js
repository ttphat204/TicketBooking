const sql = require('mssql');

const config = {
  user: 'sa',
  password: '08012004',
  server: 'localhost',
  database: 'TicketBookingDB',
  port: 1433,
  options: { encrypt: false, trustServerCertificate: true }
};

async function run() {
  try {
    const pool = await sql.connect(config);

    // 1. Show BEFORE state
    console.log('\n=== BEFORE RESET ===');
    const before = await pool.request().query(
      'SELECT Id, Name, TotalQuantity, AvailableQuantity FROM TicketCategories'
    );
    console.table(before.recordset);

    // 2. Reset AvailableQuantity
    await pool.request().query(`
      UPDATE tc SET tc.AvailableQuantity = tc.TotalQuantity - ISNULL(booked.Total, 0)
      FROM TicketCategories tc
      LEFT JOIN (
          SELECT oi.TicketCategoryId, SUM(oi.Quantity) AS Total
          FROM OrderItems oi
          INNER JOIN Orders o ON o.Id = oi.OrderId
          WHERE o.Status IN ('Pending', 'Confirmed')
          GROUP BY oi.TicketCategoryId
      ) booked ON booked.TicketCategoryId = tc.Id;
    `);

    // 3. Show AFTER state
    console.log('\n=== AFTER RESET ===');
    const after = await pool.request().query(
      'SELECT Id, Name, TotalQuantity, AvailableQuantity FROM TicketCategories'
    );
    console.table(after.recordset);

    console.log('\n✅ Reset AvailableQuantity successfully!');
    await pool.close();
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

run();
