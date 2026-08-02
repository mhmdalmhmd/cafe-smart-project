const express = require('express');
const path = require('path');
const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static(__dirname)); // لتشغيل ملف index.html

let ordersDatabase = []; // مصفوفة لتخزين الطلبات النشطة مؤقتاً

// 1. استقبال الطلبات من الهواتف
app.post('/api/orders', (req, res) => {
    const { table, items, total } = req.body;
    const newOrder = {
        id: ordersDatabase.length + 1,
        table: table,
        items: items.map(i => i.name).join(' + '),
        total: total,
        time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
        status: 'جاري التحضير'
    };
    ordersDatabase.unshift(newOrder); // وضع أحدث الطلبات في الأعلى
    res.status(201).json({ success: true, order: newOrder });
});

// 2. جلب الطلبات للوحة تحكم الباريستا
app.get('/api/orders', (req, res) => {
    res.json(ordersDatabase);
});

// 3. تحديث حالة الطلب أو مسحه
app.post('/api/orders/complete', (req, res) => {
    const { id } = req.body;
    ordersDatabase = ordersDatabase.filter(order => order.id !== id);
    res.json({ success: true });
});

// 4. صفحة لوحة تحكم الباريستا المدمجة للكمبيوتر أو تابلت المقهى
app.get('/dashboard', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
        <meta charset="UTF-8"><title>شاشة طلبات الباريستا</title>
        <style>
            body { font-family: sans-serif; background: #2c3e50; color: white; padding: 20px; }
            .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; margin-top: 20px; }
            .order-card { background: #34495e; padding: 15px; border-radius: 10px; border-top: 5px solid #e67e22; box-shadow: 0 4px 6px rgba(0,0,0,0.2); }
            .table-num { font-size: 1.4rem; font-weight: bold; color: #f1c40f; margin-bottom: 10px; }
            .items { font-size: 1.1rem; min-height: 50px; background: rgba(0,0,0,0.1); padding: 8px; border-radius: 5px; }
            .btn-done { background: #2ecc71; border:none; color:white; width:100%; padding: 10px; font-weight:bold; margin-top:15px; cursor:pointer; border-radius:5px; }
        </style>
        <script>
            // تحديث الشاشة تلقائياً كل 4 ثوانٍ لجلب الطلبات الجديدة فوراً
            setInterval(async () => {
                const res = await fetch('/api/orders');
                const orders = await res.json();
                const container = document.getElementById('orders-grid');
                container.innerHTML = orders.length === 0 ? '<h2>لا توجد طلبات نشطة حالياً 👍</h2>' : '';
                orders.forEach(o => {
                    container.innerHTML += \`
                        <div class="order-card">
                            <div class="table-num">طاولة: \${o.table} <span style="font-size:0.8rem; color:#bbb; float:left;">\${o.time}</span></div>
                            <div class="items">\${o.items}</div>
                            <div style="margin-top:10px;">الحساب: <b>\${o.total} ر.س</b></div>
                            <button class="btn-done" onclick="completeOrder(\${o.id})">تم التوصيل ✓</button>
                        </div>\`;
                });
            }, 4000);

            async function completeOrder(id) {
                await fetch('/api/orders/complete', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({ id })
                });
                window.location.reload();
            }
        </script>
    </head>
    <body>
        <h1>شاشة استلام طلبات الطاولات الفورية ☕</h1>
        <div class="grid" id="orders-grid">جاري تحميل الطلبات الحالية...</div>
    </body>
    </html>
    `);
});

// تشغيل العميل تلقائياً عند فتح السيرفر الأساسي
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`🚀 النظام يعمل بنجاح بالكامل!`);
    console.log(`📱 رابط جوال العميل: http://localhost:${PORT}/?table=5`);
    console.log(`💻 شاشة الباريستا في المقهى: http://localhost:${PORT}/dashboard`);
    console.log(`====================================================`);
});
