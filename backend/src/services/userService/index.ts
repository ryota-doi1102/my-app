import { searchUsers } from "./API-USER-01.js";
import { createUserProfile } from "./API-USER-02.js";
import { getUserProfile } from "./API-USER-03.js";
import { updateUserProfile } from "./API-USER-04.js";
import { deleteUser } from "./API-USER-05.js";

export const userService = {
	searchUsers,
	createUserProfile,
	getUserProfile,
	updateUserProfile,
	deleteUser,
};