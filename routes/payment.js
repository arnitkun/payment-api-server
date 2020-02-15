const express = require('express');
const uuidv4 = require('uuid/v4');

function paymentHandler(req, res, next) {
  const {user_name, amount, payment_type} = req.body;

  if (!user_name || !amount || !payment_type) {
    res.status(400).send({
      status: 'FAILIURE',
      error: 'Missing one of required params: user_name, amount, payment_type',
    });
    return;
  }

  if (typeof user_name !== 'string' || typeof amount !== 'number') {
    res.status(400).send({
      status: 'FAILIURE',
      error:
        'Malformatted param type. user_name must be string, amount must be a number',
    });
    return;
  }

  if (payment_type !== 'CREDIT' && payment_type !== 'DEBIT') {
    res.status(400).send({
      status: 'FAILIURE',
      error: 'payment_type must be either DEBIT or CREDIT',
    });
    return;
  }

  if (Math.random() > 0.75) {
    res.status(500).send({
      status: 'FAILIURE',
      error: 'Internal error when processing payment',
    });
    return;
  }

  res.send({
    status: 'SUCCESS',
    payment_id: uuidv4(),
  });
}

module.exports = {
  paymentHandler,
};
