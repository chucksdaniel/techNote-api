const rateLimit = require("express-rate-limit");
const { logEvents } = require("./logger");

const loginLimiter = rateLimit({
	windowMs: 60 * 1000, // a minute
	max: 5, // Limit each IP to 5 login requests per window per minute
	mesaage: {
		message:
			"Too many login attempts from this IP, Please try again after a 60 second pause",
	},
	handler: (req, res, next, options) => {
		logEvents(
			`Too many Requests: ${options.message.message}\t${req.method}\t${req.url}\t${req.headers.origin}`,
			"errLog.log"
		);
	},
	standardHeaders: true, // Return rate limit info in the `RateLimit-*`headers
	legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

module.exports = loginLimiter;
