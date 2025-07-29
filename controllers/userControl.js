const { validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const db = require("../config/dbconnection");
const jwt = require("jsonwebtoken");
const { jwt_secret } = process.env;

const register = (req, res) => {
  const errors = validationResult(req);

  let userid = Math.floor(Math.random() * (99999 - 1000) + 1000);
  const mypassword = Math.floor(Math.random() * (99999 - 1000) + 1000);

  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  db.query(
    `SELECT * FROM users where  LOWER(email) = LOWER(${db.escape(
      req.body.email
    )});`,
    (err, result) => {
      if (result && result.length) {
        return res.status(409).send({
          msg: "This user already registered",
        });
      } else {
        bcrypt.hash(req.body.pass, 10, (err, hash) => {
          if (err) {
            return res.status(400).send({
              msg: hash,
            });
          } else {
            //insert data into database
            console.log(`INSERT INTO users (name,uname,contact,pass,type,email,last_loggedin) VALUES(
              '${req.body.name}',
              '${userid}',
              '${req.body.contact}',
              '${hash}',
              '${req.body.type}',
              '${req.body.email}',
              '${req.body.lastloggedin}'
              );`);
            db.query(
              `INSERT INTO users (name,uname,contact,pass,type,email,last_loggedin) VALUES(
              '${req.body.name}',
              '${userid}',
              '${req.body.contact}',
              '${hash}',
              '${req.body.type}',
              '${req.body.email}',
              '${req.body.lastloggedin}'
              );`,
              (err, result) => {
                if (err) {
                  return res.status(400).send({
                    msgs: err,
                  });
                }
                return res.status(200).send({
                  msg: "user data inserted successfully",
                });
              }
            );
          }
        });
      }
    }
  );
};
const login = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  console.log(`SELECT * FROM users WHERE uname=${db.escape(req.body.uname)}`);
  db.query(
    `SELECT * FROM users WHERE uname=${db.escape(req.body.uname)};`,
    (err, result) => {
      if (err) {
        return res.status(400).send({
          msg: err,
        });
      }
      if (!result) {
        res.status(500).json({ error: 'Uname OR Password is Incorrect' });
        return;

      }
     // console.log(result.length);
      if (result.length === 0) {
        res.status(500).json({ error: 'Uname OR Password is Incorrect' });
        return;
      }
      else {
        bcrypt.compare(req.body.pass, result[0]["pass"], (berr, bresult) => {
          if (berr) {
            res.status(200).json(berr);
            return;

          }
          if (bresult) {
            // console.log(jwt_secret);
            const token = jwt.sign(
              {
                id: result[0]["id"],
                type: result[0]["type"]
              },
              jwt_secret,
              { expiresIn: "60m" }
            );
          //  console.log(`UPDATE users set last_loggedin=now() WHERE id='${result[0]["id"]}'`);
            db.query(
              `UPDATE users set last_loggedin=now() WHERE id='${result[0]["id"]}'`
            );
            res.status(200).json({
              msg: "Logged in Successfully",
              token,
              data: result[0],
            });

          } else {
            res.status(500).json({ error: 'Password is Incorrect' });

          }
        });
      }
    }
  );
};

const getuser = (req, res) => {
  const authToken = req.headers.authorization.split(" ")[1];
  const decode = jwt.verify(authToken, jwt_secret);
  db.query(
    `SELECT * FROM users WHERE id=?`,
    decode.id,
    function (err, result, fields) {
      if (err) throw error;
      return res.status(200).send({
        success: true,
        data: result,
        message: "Fetch Dataa Sucessfully",
      });
    }
  );
};
module.exports = {
  register,
  login,
  getuser,
};
