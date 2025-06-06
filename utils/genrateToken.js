const jwt = require("jsonwebtoken");

module.exports.generateToken = (id, res) => {
  const token = jwt.sign({ id }, process.env.Jwt_secret, {
    expiresIn: "15d",
  });

  res.cookie("token", token, {
    maxAge: 15 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    sameSite: "strict",
  });
};
