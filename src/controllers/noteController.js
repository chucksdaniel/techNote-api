const asyncHandler = require("express-async-handler");
const bcrypt = require("bcrypt");

const User = require("../database/models/User");
const Note = require("../database/models/Note");

/**
 * @desc Get all notes
 * @route Get /notes
 * @access Private
 */

const getAllNotes = asyncHandler(async (req, res) => {
	const notes = await Note.find().lean();

	if (!notes?.length) {
		return res.status(400).json({ message: "No note found" });
	}

	// Add username to each note; Promise.all with map() : https://youtu.be/4lqJBBEpjRE
	const noteWithUser = await Promise.all(
		notes.map(async (note) => {
			const user = await User.findById(note.user).lean().exec();
			return { ...note, username: user.username };
		})
	);
	res.status(200).json(noteWithUser);
});

/**
 * @desc Create a new note
 * @route Post /notes
 * @access Private
 */

const createNewNote = asyncHandler(async (req, res) => {
	const { title, text, user } = req.body;

	// if (!title || !text || !user) {
	// 	return res.status(400).json({ message: "All fields are required" });
	// }

	if (!title) {
		return res.status(400).json({ message: "Title is required" });
	}

	if (!text) {
		return res.status(400).json({ message: "Text is required" });
	}

	if (!user) {
		return res.status(400).json({ message: "User is required" });
	}

	// Duplication
	const duplicateNote = await Note.findOne({ title }).lean().exec();
	if (duplicateNote) {
		return res.status(409).json({ message: "Note Duplication error" });
	}

	const noteObject = { title, text, user };

	const note = await Note.create(noteObject);

	if (note) {
		res.status(201).json({ message: `New note ${title} created` });
	} else {
		res.status(400).json({ message: "Invalid date received" });
	}
});

/**
 * @desc Update a user
 * @route Patch /users
 * @access Private
 */

const updateNote = asyncHandler(async (req, res) => {
	const { id, title, text, completed, user } = req.body;

	if (!id) {
		return res.status(400).json({ message: "id is required" });
	}
	if (!title) {
		return res.status(400).json({ message: "title is required" });
	}

	if (!text) {
		return res.status(400).json({ message: "text is required" });
	}

	if (!user) {
		return res.status(400).json({ message: "user is required" });
	}

	if (typeof completed !== "boolean") {
		return res.status(400).json({
			message: "Completed is required and must be of type Boolean",
		});
	}

	const note = await Note.findById(id).exec();

	if (!note) {
		return res.status(400).json({ message: "Note not found" });
	}

	const duplicate = await Note.findOne({ title }).lean().exec();
	//allow update to the original user

	if (duplicate && duplicate?._id.toString() !== id) {
		return res
			.status(409)
			.json({ message: "Title already exist, Duplicate Title" });
	}

	note.title = title;
	(note.user = user), (note.text = text);
	note.completed = completed;

	const updateNote = await note.save();

	res.json({ message: `${updateNote.title} updated successfully` });
});

/**
 * @desc Delete a user
 * @route Delete /users
 * @access Private
 */

const deleteNote = asyncHandler(async (req, res) => {
	const { id } = req.body;

	if (!id) {
		return res.status(400).json({ message: "Note Id is required" });
	}
	const notes = await Note.findOne({ user: id }).lean().exec();

	const note = await Note.findById(id).exec();

	if (!note) {
		return res.status(400).json({ message: "Note not found" });
	}

	const result = await note.deleteOne();

	const reply = `Note ${result.title} with the ID ${result.id} has been deleted`;

	res.json(reply);
});

module.exports = {
	getAllNotes,
	createNewNote,
	updateNote,
	deleteNote,
};
