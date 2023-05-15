module.exports.generateResetPasswordHtml = (token) => {
  return `<h1>RESET PASSWORD EMAIL</h1>
      <p>Token: ${token}</p>
      `;
};

module.exports.generateActivateUserHtml = (url) => {
  return `<h1>ACTIVATE USER</h1>
    <p> URL: ${url}</p>`;
};
