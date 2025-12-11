function validatePassword(password) {
  const minLength = 8; // minimum characters
  const uppercase = /[A-Z]/;
  const lowercase = /[a-z]/;
  const number = /[0-9]/;
  const specialChar = /[!@#$%^&*(),.?":{}|<>]/;

  if (password.length < minLength) {
    return 'Password must be at least 8 characters long.';
  }
  if (!uppercase.test(password)) {
    return 'Password must contain at least one uppercase letter.';
  }
  if (!lowercase.test(password)) {
    return 'Password must contain at least one lowercase letter.';
  }
  if (!number.test(password)) {
    return 'Password must contain at least one number.';
  }
  if (!specialChar.test(password)) {
    return 'Password must contain at least one special character.';
  }

  return null;
}

module.exports = {validatePassword};