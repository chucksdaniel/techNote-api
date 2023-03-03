const User = require("../database/models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");

/**
 * @desc Login a user
 * @route Post /api/auth
 * @access Public
 */
const login = asyncHandler(async (req, res) => {
	const { username, password } = req.body;

	if (!username) {
		return res.status(400).json({ message: "Please enter your username" });
	}
	if (!password) {
		return res.status(400).json({ message: "Please enter your password" });
	}

	const foundUser = await User.findOne({ username }).exec();

	if (!foundUser || !foundUser.active) {
		return res.status(401).json({ message: "Unauthorized" });
	}

	const match = await bcrypt.compare(password, foundUser.password);
	if (!match) {
		return res.status(401).json({ message: "Unauthorized" });
	}

	const accessToken = jwt.sign(
		{
			USerInfo: {
				username: foundUser.username,
				role: foundUser.roles,
			},
		},
		process.env.ACCEESS_SECRET,
		{ expiresIn: "10s" }
	);

	const refreshToken = jwt.sign(
		{
			username: foundUser.username,
		},
		process.env.REFRESH_TOKEN,
		{ expiresIn: "7d" }
	);

	// Create secure cookie with refresh token
	res.cookie("jwt", refreshToken, {
		httpOnly: true, // accessible only by web server
		secure: true, //https
		sameSite: "None", // Cross-site cookie
		maxAge: 7 * 24 * 60 * 60 * 1000, // Cookie expiry: set to match rt
	});

	res.json({ accessToken });
});

/**
 * @desc Refresh
 * @route Get /api/auth/refresh
 * @access Public - because access token has expired
 */
const refresh = (req, res) => {
	const cookies = req.cookies;

	if (!cookies?.jwt) return res.status(401).json({ message: "Forbidden" });

	const refreshToken = cookies.jwt;

	jwt.verify(
		refreshToken,
		process.env.REFRESH_TOKEN,
		asyncHandler(async (err, decoded) => {
			if (err) return res.status(403).json({ message: "Forbidden" });

			const foundUser = await User.findOne({
				username: decoded.username,
			}).exec();

			if (!foundUser)
				return res.status(401).json({ message: "unauthorized" });

			const accessToken = jwt.sign(
				{
					UserInfo: {
						username: foundUser.username,
						roles: foundUser.roles,
					},
				},
				process.env.ACCEESS_SECRET,
				{ expiresIn: "15m" }
			);
			res.json({ accessToken });
		})
	);
};

/**
 * @desc Logout a user
 * @route Post /api/auth/logout
 * @access Public - Just clear cookie if exists
 */
const logout = asyncHandler(async (req, res) => {
	const cookies = req.cookies;
	if (!ccokies?.jwt) return res.sendStatus(204); // No content
	res.clearCookie("jwt", { httpOnly: true, sameSite: "None", secure: true });
	res.json({ message: "Cookie Cleared" });
});

module.exports = {
	login,
	refresh,
	logout,
};
