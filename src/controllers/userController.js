const asyncHandler = require("express-async-handler");
const bcrypt = require("bcrypt");

const User = require("../database/models/User");
const Note = require("../database/models/Note");

/**
 * @desc Get all users
 * @route Get /users
 * @access Private
 */

const getAllUsers = asyncHandler(async (req, res) => {
	const users = await User.find().select("-password").lean();

	if (!users?.length) {
		return res.status(400).json({ message: "No user found" });
	}

	res.status(200).json(users);
});

/**
 * @desc Create a new users
 * @route Post /users
 * @access Private
 */

const createNewUser = asyncHandler(async (req, res) => {
	const { username, password, email, roles } = req.body;

	if (
		!username ||
		!password ||
		// !email ||
		!Array.isArray(roles) ||
		!roles.length
	) {
		return res.status(400).json({ message: "All fields are required" });
	}

	// Duplication
	const usernameExist = await User.findOne({ username }).lean().exec();
	if (usernameExist) {
		return res.status(409).json({ message: "Username already taken" });
	}

	const hashPassword = await bcrypt.hash(password, 10);

	const userObject = { username, email, password: hashPassword, roles };

	const user = await User.create(userObject);

	if (user) {
		res.status(201).json({ message: `New user ${username} created` });
	} else {
		res.status(400).json({ message: "Invalid user date received" });
	}
});

/**
 * @desc Update a user
 * @route Patch /users
 * @access Private
 */

const updateUser = asyncHandler(async (req, res) => {
	const { id, username, email, roles, active, password } = req.body;

	if (!id) {
		return res.status(400).json({ message: "id is required" });
	}
	if (!username) {
		return res.status(400).json({ message: "username is required" });
	}

	if (!Array.isArray(roles) || !roles.length) {
		return res
			.status(400)
			.json({ message: "roles is required and must be an array" });
	}

	if (typeof active !== "boolean") {
		return res
			.status(400)
			.json({ message: "active is required and must be of type Boolean" });
	}

	// if (
	// 	!id ||
	// 	!username ||
	// 	!Array.isArray(roles) ||
	// 	!roles.length ||
	// 	typeof active !== "boolean"
	// ) {
	// 	return res.status(400).json({ message: "All fields are required" });
	// }

	const user = await User.findById(id).exec();

	if (!user) {
		return res.status(400).json({ message: "User not found" });
	}

	const duplicate = await User.findOne({ username }).lean().exec();
	//allow update to the original user

	if (duplicate && duplicate?._id.toString() !== id) {
		return res.status(409).json({ message: "Username already exist" });
	}

	user.username = username;
	(user.email = email), (user.roles = roles);
	user.active = active;

	if (password) {
		user.password = await bcrypt.hash(password, 10);
	}

	const updateUser = await user.save();

	res.json({ message: `${updateUser.username} updated successfully` });
});

/**
 * @desc Delete a user
 * @route Delete /users
 * @access Private
 */

const deleteUser = asyncHandler(async (req, res) => {
	const { id } = req.body;

	if (!id) {
		return res.status(400).json({ message: "User Id is required" });
	}
	const notes = await Note.findOne({ user: id }).lean().exec();

	if (notes?.length) {
		return res.status(400).json({ message: "User has assigned notes" });
	}

	const user = await User.findById(id).exec();

	if (!user) {
		return res.status(400).json({ message: "User not found" });
	}

	const result = await user.deleteOne();

	const reply = `Username ${result.username} with the ID ${result.id} has been deleted`;

	res.json(reply);
});

module.exports = {
	getAllUsers,
	createNewUser,
	updateUser,
	deleteUser,
};
