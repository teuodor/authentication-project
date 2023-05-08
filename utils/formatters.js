module.exports.formatUser = (user) => {
  return {
    id: user._id,
    email: user.email,
    username: user.username,
    role: user.role,
    photo: user.photo,
    createdAt: user.createdAt,
  };
};
