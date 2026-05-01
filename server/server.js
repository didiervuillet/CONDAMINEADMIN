const dotenv = require("dotenv");
const path = require("path");
const fs = require("fs");
const express = require("express");
const mongoose = require("mongoose");

// --------------------
// ENV
// --------------------
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

console.log("MONGO:", process.env.MONGO_URI);

// --------------------
// EXPRESS
// --------------------
const app = express();
const port = process.env.PORT || 3000;
const SERVER_BOOT_ID = Date.now();

app.use(express.json({ limit: '10mb' }));

// --------------------
// GLOBAL FETCH FIX
// --------------------
if (!global.fetch) {
    global.fetch = require("node-fetch");
}

// --------------------
// LOAD MODELS
// --------------------
const modelsPath = path.join(__dirname, 'models');
if (fs.existsSync(modelsPath)) {
    fs.readdirSync(modelsPath).forEach(file => {
        if (file.endsWith('.js')) {
            require(path.join(modelsPath, file));
        }
    });
}

// --------------------
// ROUTES
// --------------------
const authRoutes = require('./domains/auth/auth.routes.js');
const adminRoutes = require('./domains/admin/admin.routes.js');
const structureRoutes = require('./domains/structure/structure.routes.js');

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/structure', structureRoutes);

// --------------------
// SYSTEM ROUTES
// --------------------
app.get('/api/system/apply-status', (req, res) => {
    const statusFile = path.join(__dirname, '../apply_status.json');
    if (fs.existsSync(statusFile)) {
        try {
            res.json(JSON.parse(fs.readFileSync(statusFile, 'utf8')));
        } catch {
            res.json({ status: 'OK' });
        }
    } else {
        res.json({ status: 'OK' });
    }
});

app.get('/api/system/version', (req, res) => {
    try {
        const vPath = path.join(__dirname, 'version.json');
        if (fs.existsSync(vPath)) {
            const vData = JSON.parse(fs.readFileSync(vPath, 'utf8'));
            return res.json({ hash: String(vData.build || 1) });
        }
    } catch { }
    res.json({ hash: '1' });
});

app.get('/api/check-deploy', (req, res) => {
    res.json({
        status: "OK",
        bootId: SERVER_BOOT_ID,
        db: mongoose.connection.readyState === 1 ? "CONNECTED" : "OFFLINE"
    });
});

// --------------------
// DB
// --------------------
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ DATABASE CORE LINKED'))
    .catch(err => console.error("❌ DB CONNECTION ERROR :", err.message));

// --------------------
// FRONTEND
// --------------------
const distPath = path.resolve(process.cwd(), 'client', 'dist');
if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
    });
}

// --------------------
// START
// --------------------
app.listen(port, '127.0.0.1', () =>
    console.log(`🚀 ADMIN CORE RUNNING ON PORT ${port}`)
);
