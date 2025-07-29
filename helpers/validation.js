const {check} = require('express-validator');
exports.signupValidation=
[
 check('name',"Name is Required").not().isEmpty(),
 check('email',"Please enter valid Email").isEmail().normalizeEmail({gmail_remove_dots:true}),
 check('contact',"Contact Number  is Required").not().isEmpty(),
 check('password',"Password is Required").not().isLength({min:6})
]

exports.loginValidation=
[
 check('uname'," Username Missing").not().isEmpty(),
 
 check('password',"Password Missing").not().isLength({min:6})
]
