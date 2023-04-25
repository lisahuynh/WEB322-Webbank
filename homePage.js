const express = require('express');
const router = express.Router();
const path = require("path");

//redirect / page to login.hbs
router.get("/", (req, res) => {
        res.redirect('login');
});

//web bank home page (login.hbs)
router.get("/login", (req, res) => {

    console.log(req.session);

    res.render('login');
});

module.exports = router;