const express = require('express');
const router = express.Router();
const { handleChat } = require('./chatbotController');

router.post('/chat', handleChat);

module.exports = router;
