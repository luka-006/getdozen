/** Confirmed fake accounts that sign in with password only (no email OTP). */
const PASSWORD_ONLY_TEST_LOGINS = new Set(
  ["john@getdozen.dev"]
    .concat(
      (process.env.PASSWORD_ONLY_TEST_LOGINS ?? "")
        .split(",")
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean),
    )
    .map((e) => e.toLowerCase()),
);

export function isPasswordOnlyTestLogin(email: string) {
  return PASSWORD_ONLY_TEST_LOGINS.has(email.trim().toLowerCase());
}
