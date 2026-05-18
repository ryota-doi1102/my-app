import { searchUsers } from "./API-USER-01.js";
import { createUserProfile } from "./API-USER-02.js";
import { getUserProfile } from "./API-USER-03.js";
import { updateUserProfile } from "./API-USER-04.js";
import { deleteUser } from "./API-USER-05.js";
import { deleteUsers } from "./API-USER-06.js";
import { submitImportJob } from "./API-USER-08.js";
import { getImportJob } from "./API-USER-09.js";
import { submitExportJob } from "./API-USER-10.js";
import { getExportJob } from "./API-USER-11.js";

export const userService = {
	searchUsers,
	createUserProfile,
	getUserProfile,
	updateUserProfile,
	deleteUser,
	deleteUsers,
	submitImportJob,
	getImportJob,
	submitExportJob,
	getExportJob,
};