/**
 * CSC4035 Final Project - Express Server
 *
 * TODO: Extend this starter with your routes and middleware
 */

const express = require('express');
const path = require('path');
const helmet = require('helmet');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// =============================================================================
// MIDDLEWARE
// =============================================================================

// Security headers
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
}));

// CORS
app.use(cors());

// Parse JSON bodies
app.use(express.json());

// Parse URL-encoded bodies
app.use(express.urlencoded({ extended: true }));

// Serve static files from public directory
app.use(express.static(path.join(__dirname, '..', 'public')));

// Request logging (development)
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
    next();
});

// =============================================================================
// API ROUTES
// =============================================================================

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'Server is running',
        timestamp: new Date().toISOString()
    });
});

// TODO: Add your API routes here
// Example:
// const productRoutes = require('./routes/products');
// app.use('/api/products', productRoutes);

// =============================================================================
// EXAMPLE: Sample resource routes (replace with your implementation)
// =============================================================================

// In-memory data store (replace with your data model)
let items = [
    { id: '1', name: 'Sample Item 1', createdAt: new Date().toISOString() },
    { id: '2', name: 'Sample Item 2', createdAt: new Date().toISOString() },
];

// GET all items
app.get('/api/items', (req, res) => {
    res.json({
        success: true,
        count: items.length,
        data: items
    });
});

// GET single item
app.get('/api/items/:id', (req, res) => {
    const item = items.find(i => i.id === req.params.id);
    if (!item) {
        return res.status(404).json({
            success: false,
            error: 'Item not found'
        });
    }
    res.json({
        success: true,
        data: item
    });
});

// POST create item
app.post('/api/items', (req, res) => {
    const { name } = req.body;

    if (!name || name.trim() === '') {
        return res.status(400).json({
            success: false,
            error: 'Name is required'
        });
    }

    const newItem = {
        id: String(Date.now()),
        name: name.trim(),
        createdAt: new Date().toISOString()
    };

    items.push(newItem);

    res.status(201).json({
        success: true,
        data: newItem
    });
});

// PUT update item
app.put('/api/items/:id', (req, res) => {
    const index = items.findIndex(i => i.id === req.params.id);

    if (index === -1) {
        return res.status(404).json({
            success: false,
            error: 'Item not found'
        });
    }

    items[index] = {
        ...items[index],
        ...req.body,
        id: req.params.id,
        updatedAt: new Date().toISOString()
    };

    res.json({
        success: true,
        data: items[index]
    });
});

// DELETE item
app.delete('/api/items/:id', (req, res) => {
    const index = items.findIndex(i => i.id === req.params.id);

    if (index === -1) {
        return res.status(404).json({
            success: false,
            error: 'Item not found'
        });
    }

    items.splice(index, 1);
    res.status(204).send();
});

// =============================================================================
// ERROR HANDLING
// =============================================================================

// 404 handler
app.use((req, res, next) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint not found'
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Error:', err.message);

    res.status(err.status || 500).json({
        success: false,
        error: process.env.NODE_ENV === 'production'
            ? 'Internal server error'
            : err.message
    });
});

// =============================================================================
// START SERVER
// =============================================================================

app.listen(PORT, () => {
    console.log(`
===========================================
  CSC4035 Final Project Server
  Running on http://localhost:${PORT}
===========================================
    `);
});

module.exports = app;
