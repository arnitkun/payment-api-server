const express = require('express');
const mysql = require('mysql');

const CONFIG = {
    host: 'localhost',
    user     : 'root',
    password : 'root',
    database : 'cus'
}

const plans = {
    plan_ids: ['FREE', 'TRIAL', 'LITE_1M', 'PRO_1M', 'LITE_6M', 'PRO_6M'],
    validity: [Infinity, 7, 30, 30, 180, 180],
    cost: [0.0, 0.0, 100.0, 200.0, 500.0, 900.0]
}


var connection = mysql.createConnection(CONFIG);


function convertDate(str) {
    let [year, month, day] = str.split('-');
    let d = new Date(year, month-1, day);

    date = [
        d.getFullYear(),
        ('0' + (d.getMonth() + 1)).slice(-2),
         ('0' + d.getDate()).slice(-2)
        ].join('-');
    
    return date;
}

function subscriptionHandler(req, res, next) {
    const {user_name, contact_number, New_plan_id, startdate} = req.body;

    if (!user_name || !New_plan_id || !contact_number || !startdate) {
        res.status(400).send({
          status: 'FAILURE',
          error: 'Missing one of required params: user_name, New_plan_id, contact_number, startdate',
        });
        return;
    }

    if (typeof user_name !== 'string' || typeof New_plan_id !== 'string' || typeof contact_number !== 'string' || typeof startdate !== 'string') {
        res.status(400).send({
          status: 'FAILURE',
          error:
            'Malformatted param type. user_name must be string, New_plan_id must be string, contact_number must be string',
        });
        return;
    }

   
    date = convertDate(startdate);
    


    res.send({
        
        
        'Plan_id': New_plan_id,
        'start date': date
        

        // days_left: days_left,

    });
}

function getCurrentPlan(req, res, next) {
    const {user_name} = req.body;

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


module.exports = {
    subscriptionHandler,
    getCurrentPlan
};