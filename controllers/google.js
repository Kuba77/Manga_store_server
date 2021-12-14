const { OAuth2Client } = require("google-auth-library");
const jwt = require("jsonwebtoken");
const keys = require("../config/keys");
const uniqueRandom = require("unique-random");

const rand = uniqueRandom(10000000, 99999999);

//сщздаем клиента
const client = new OAuth2Client(keys.googleClientId);

// Load Customer model
const Customer = require("../models/Customer");

exports.googlelogin = (req, res) => {
  //оплучили токен от гугла
  const { tokenId } = req.body;

  client
    //проверка токена и клиента айди(в креденшеналах)
    .verifyIdToken({
      idToken: tokenId,
      audience: keys.googleClientId,
    })
    //берем инфу из профиля гугла
    .then((response) => {
      const { email_verified, name, email, given_name, family_name, picture } =
        response.payload;

      if (email_verified) {
        // если почта верефицирована после проверки то ищем клиента по базе
        Customer.findOne({ email }).exec((err, customer) => {
          if (err) {
            // если ошибка то пишем
            return res
              .status(400)
              .json({ message: `хз что произошло: ${err}` });
          } else {
            if (customer) {
              //если покупатель уже есть то делаем ему токен
              //что ложим в токен
              const payload = {
                id: customer.id,
                firstName: customer.firstName,
                lastName: customer.lastName,
                email: customer.email,
                isAdmin: customer.isAdmin,
                avatarUrl: customer.avatarUrl,
              };
              // создание токена
              jwt.sign(
                payload,
                keys.secretOrKey,
                { expiresIn: 36000 },
                (err, token) => {
                  res.json({
                    success: true,
                    token: "Bearer " + token,
                  });
                }
              );
            } else {
              //если покупателя нет то созадем его на базе
              let password = "123456789";
              let customerNo = rand();
              const newCustomer = new Customer({
                //инфа из гугловского профиля
                email,
                password,
                firstName: given_name,
                login: name,
                avatarUrl: picture,
                //номер создаем сами через рандом
                customerNo,
                lastName: family_name,
              });

              //сохраняем пользывателя
              newCustomer.save().then((customer) => {
                // res.json(customer);
                //после удачного создания делаем ему токен и возвращаем
                const payload = {
                  id: customer.id,
                  firstName: customer.firstName,
                  lastName: customer.lastName,
                  email: customer.email,
                  avatarUrl: customer.avatarUrl,
                  isAdmin: customer.isAdmin,
                };
                // создание токена
                jwt.sign(
                  payload,
                  keys.secretOrKey,
                  { expiresIn: 36000 },
                  (err, token) => {
                    res.json({
                      success: true,
                      token: "Bearer " + token,
                    });
                  }
                );
              });
            }
          }
        });
      }
    });
};
