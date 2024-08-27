const express = require('express');
const urlController = require('../controllers/urlController'); 
const authController = require('../controllers/authController'); 
const authRoutes = require('./authRoutes');

const router = express.Router();

router.use('/auth', authRoutes);

router.post('/url/shorten', urlController.shortenUrl);

router.get('/url/list', authController.authenticate, urlController.listUrls);
router.put('/url/:shortId/edit', authController.authenticate, urlController.editUrl);
router.delete('/url/:shortId/delete', authController.authenticate, urlController.deleteUrl);
router.get('/url/:shortId/increment', urlController.incrementAccessCount);
router.get('/:shortId', urlController.redirectUrl);

module.exports = router;
