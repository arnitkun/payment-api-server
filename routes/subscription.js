const express = require('express');
const mysql = require('mysql');
const moment = require('moment');
const request = require('request');
// const http = require('http');

const CONFIG = {
    host: 'localhost',
    user     : 'root',
    password : 'root',
    database : 'cus'
}

var plans = {
    plan_ids: ['FREE', 'TRIAL', 'LITE_1M', 'PRO_1M', 'LITE_6M', 'PRO_6M'],
    validity: [Infinity, 7, 30, 30, 180, 180],
    cost: [0.0, 0.0, 100.0, 200.0, 500.0, 900.0]
}


var connection = mysql.createConnection(CONFIG);

function makeTransaction(uname, payment_type="DEBIT", amt) {
    let transactionObject = {};
    transactionObject.user_name = uname;
    transactionObject.payment_type = payment_type;
    transactionObject.amount= amt
    return transactionObject
}

// var transactionObject = {
//     "user_name": <string>,
//     /* "payment_type": </string><one of "DEBIT"|"CREDIT">, */
//     "payment_type"
//     "amount": <number>
//   }


function getValidity(pid, start) {
    pid = pid.toUpperCase();
  
  if(plans.plan_ids.includes(pid) && moment(start, 'YYYY-MM-DD').isValid()){
    
    for(let i = 0; i < plans.plan_ids.length; i++){
        {
          if(plans.plan_ids[i] === pid){
            let validity = plans.validity[i];
            return validity;
          }
        }
      }
    } else {
      console.log("Incorrect format for plan id or start date.");
    }    
}

function getCost(pid) {
    pid = pid.toUpperCase();
    
    if(plans.plan_ids.includes(pid)) {
      for(let i = 0; i < plans.plan_ids.length; i++){
          
            if(plans.plan_ids[i] === pid){
              let price = plans.cost[i];
              return price;
            }
          }
  } else {
    console.log("Invalid plan!");
  } 
}

function getEndDate(start, number_of_days) {
    return moment(start).add(number_of_days, "days").format('YYYY-MM-DD');
}


function subscriptionHandler(req, res, next) {
    var {user_name, contact_number, New_plan_id, startdate} = req.body;
    New_plan_id = New_plan_id.toUpperCase();
    
    if (!user_name || !New_plan_id || !contact_number || !startdate) {
        res.status(400).send({
          status: 'FAILURE',
          error: 'Missing one of required params: user_name, New_plan_id, contact_number, startdate',
        });
        return;
    }

    if (typeof user_name !== 'string' || typeof New_plan_id !== 'string' || typeof contact_number !== 'string') {
        res.status(400).send({
          status: 'FAILURE',
          error:
            'Malformatted param type. user_name must be string, New_plan_id must be string, contact_number must be string',
        });
        return;
    }

    if(moment(startdate, 'YYYY-MM-DD').isValid() && plans.plan_ids.includes(New_plan_id)) {
       let valid = getValidity(New_plan_id, startdate);
       let cost = getCost(New_plan_id);
       let endDate = getEndDate(startdate, valid);
       
       var postData = JSON.stringify({
        "user_name": user_name,
        "payment_type": "DEBIT",
        "amount": cost
       })

       paymentRequest(postData, function(valid){
           res.send("Success!");
       });

      
    //    res.send({     
    //     'Plan_id': New_plan_id,
    //     'start date': startdate,
    //     "cost": cost,
    //     "end Date": endDate
    //     });

    } else {
        console.log("Incorrect Date or plan. Please check.");
    }

    
}

function getCurrentPlan(req, res, next) {
    var {user_name} = req.body;

    if (!user_name) {
        res.status(400).send({
          status: 'FAILURE',
          error: 'Missing one of the required params: user_name',
        });
        return;
    }

    if (typeof user_name !== 'string') {
        res.status(400).send({
          status: 'FAILURE',
          error:
            'Malformatted param type. user_name must be string',
        });
        return;
    }

    if(user_name && typeof user_name === 'string'){
        var d = new Date();
            date = [
            d.getFullYear(),
            ('0' + (d.getMonth() + 1)).slice(-2),
             ('0' + d.getDate()).slice(-2)
            ].join('-');
            
            //push the date to the database for the user

        res.send({
            'timeStamp': date,
            'Plan Name': plans.plan_ids[1],
            'Plan validity': plans.validity[1]
        });
    }

    //return plan id, number of days left or all subscription entries for that user that are valid
    
}

function paymentRequest(ob, cb) {
    request({
        url: "http://127.0.0.1:3000/payment",
        method: 'POST',
        headers: {
            'content-type': 'application/json'
        },
        body: ob
     }, function (err, res, body){
            if(err)throw err;
            console.log(JSON.parse(body));
     });
  cb();
}

module.exports = {
    subscriptionHandler,
    getCurrentPlan
};