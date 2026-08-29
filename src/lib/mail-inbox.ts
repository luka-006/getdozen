/** Where support, bug reports, and inbound forwards are delivered. */
export function ownerInbox() {
  return (
    process.env.MAIL_FORWARD_TO?.trim() ||
    process.env.SUPPORT_TO?.trim() ||
    process.env.ADMIN_OWNER_EMAIL?.trim() ||
    "luka.kasalo.web@gmail.com"
  );
}
