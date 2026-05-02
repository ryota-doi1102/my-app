import { requestSignup } from "./API-AUTH-01.js";
import { signup } from "./API-AUTH-02.js";
import { signin } from "./API-AUTH-03.js";
import { refresh } from "./API-AUTH-04.js";
import { signout } from "./API-AUTH-05.js";
import { requestPasswordReset } from "./API-AUTH-06.js";
import { resetPassword } from "./API-AUTH-07.js";

export const authService = { requestSignup, signup, signin, refresh, signout, requestPasswordReset, resetPassword };