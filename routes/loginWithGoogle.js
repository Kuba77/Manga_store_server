const express = require("express");
const router = express.Router();

//Import controllers
const { googlelogin } = require("../controllers/google");

// @route   POST /customers/googlelogin
// @desc    Register customer
// @access  Public
router.post("/", googlelogin);
module.exports = router;
