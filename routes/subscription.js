
const mysql = require('mysql');
const moment = require('moment');
const request = require('request');

const CONFIG = {
    host: 'localhost',
    user     : 'root',
    password : 'root',
    database : 'cus'
}

var plans = {
    plan_ids: ['FREE', 'TRIAL', 'LITE_1M', 'PRO_1M', 'LITE_6M', 'PRO_6M'],
    validity: [36500, 7, 30, 30, 180, 180],
    cost: [0.0, 0.0, 100.0, 200.0, 500.0, 900.0]
}


var connection = mysql.createConnection(CONFIG);

function getValidity(pid) {
    pid = pid.toUpperCase();
  
  if(plans.plan_ids.includes(pid)){
    
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


function setPostData(uname, status, bal, newplan) {
    let newPlanCost = getCost(newplan);
    let ob ={};
    ob.user_name = uname;
    switch(status){
        case "upgrade":
            totalCost = newPlanCost - bal;
            ob.payment_type = "DEBIT";
            ob.amount = totalCost;
            break;
        case "downgrade":
            totalCost = bal - newPlanCost;
            if(totalCost > 0){
                ob.payment_type = "CREDIT"
                ob.amount = totalCost
            } else {
                ob.payment_type = "DEBIT"
                ob.amount = Math.abs(totalcost)
            }
            break;
        case "same":
            totalCost = newPlanCost - bal;
            ob.payment_type = "DEBIT";
            ob.amount = totalCost;
            break;
    }
    return ob;
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

    // if (startdate < moment().format('YYYY-MM-DD')){
    //     res.status(400).send({
    //         status: 'FAILURE',
    //         error:'You can not choose a start date in the past. Why spend for no reason?'
    //     });
    //     return;
    // }

    
    
    let data = getFromCustomers(user_name, contact_number)
                .then(function(results){
                    return results;
                }).catch(function(err){
                    return err;
            })   
    // data.then((res) => console.log(Object.keys(res[0])));
    let duplicates = false;
    let trial = false;
    data.then(function(result) {
            for(let i = 0; i < result.length; i++){
            if(result[i].contact_number == contact_number && moment(result[i].start_date).format('YYYY-MM-DD') == startdate && result[i].plan == New_plan_id){
                duplicates = true;
            }
            if(result[i].plan == "TRIAL"){
                trial = true;
            }
        }

        if(duplicates == true){
            console.log("You already have that plan!");
            res.send("You already have that plan!");
        } else if(trial == true && New_plan_id == "TRIAL"){
            res.send("You have exhausted your trial period.")  
        } else {
            if(moment(startdate, 'YYYY-MM-DD').isValid() && plans.plan_ids.includes(New_plan_id)) {


                 let valid = getValidity(New_plan_id);
                 let cost = getCost(New_plan_id);
                
                 let endDate = getEndDate(startdate, valid);
                //  startdate = moment(startdate).format('YYYY-MM-DD');
                startdate = formattedDate(startdate);
                console.log(endDate);
                
                for(let i = 0; i < result.length; i++){
                    let startDateDb = formattedDate(result[i].start_date);
                    let currentPlan = result[i].plan;
                    if( startDateDb < startdate && formattedDate(result[i].end_date) > startdate){
                        //calculate amount by finding difference in days.
                        
                        console.log("plan overlap found!");
                        console.log("StartDate on new plan :" + startdate);
                        console.log("startDate on plan in db :" + startDateDb);
                        let diff = balanceLeft(startdate, startDateDb, currentPlan);
                        console.log("The diff is " + diff);
                        //remove the older entry with the same plan here for the user
                        let status = findDebitOrCredit(currentPlan, New_plan_id);
                        paymentObject = setPostData(user_name, status, diff, New_plan_id);

                        console.log(paymentObject)

                    }
                }



               
             //    console.log(startdate);
                
                var postData = JSON.stringify({
                 "user_name": user_name,
                 "payment_type": "DEBIT",
                 "amount": cost
                })
                
                paymentRequest(postData, function(paymentApiResponse){
                    let paymentResponse = JSON.parse(paymentApiResponse)
                    res.send(paymentResponse.status);
                 //    console.log(startdate);
                //   console.log(paymentResponse)
                    if(paymentResponse.status == "SUCCESS"){
                     writeToCustomers(user_name, contact_number, New_plan_id, startdate, endDate, cost);
                     console.log("successful payment.")
                    }
                });
                }
                
                else {
                 console.log("Incorrect Date or plan. Please check.");
             }
        }
    })


}

function findDebitOrCredit(pid_past, pid_current){
    let past = plans.plan_ids.indexOf(pid_past);
    let current = plans.plan_ids.indexOf(pid_current); 

    if(past > current){
        return "downgrade";
    } else if(past < current){
        return "upgrade";
    } else {
        return "same";
    }

}

function balanceLeft(start, end, plan) {
    let s = moment(start);
    let e = moment(end);
    let days = s.diff(e, 'days');
    // return s.diff(e, 'days');
    let amount = getCost(plan);
    let validity = getValidity(plan);
    return (amount - ( days * ( amount / validity)));

}


function formattedDate(date){
    return moment(date).format("YYYY-MM-DD");
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
            if(err) cb(err);
            cb(body);
            // console.log(JSON.parse(body));
     });
//   cb();
}

function writeToCustomers(uname, contact_number, plan, startdate, endDate) {

    connection.query(`INSERT INTO customers(user_name, contact_number, plan, \
                    start_date, end_date) values(?, ?, ?, \
                    ?, ?)`,[uname, contact_number, plan, startdate, endDate], function (err, res, fields) {
        if(err) console.log("Duplicate row found while writing to database." + err.sqlMessage);
        else
        {console.log("Written to db successfully!");}
    });
}


getFromCustomers = function(uname, contact_number) {
    return new Promise( function(resolve, reject) {
        connection.query('select user_name, contact_number, plan, start_date, end_date from customers where \
            user_name = ? AND contact_number = ?;',[uname, contact_number], function(err, rows) {
                if(rows === undefined){
                    reject(new Error("Error: undefined rows."));
                } else {
                    resolve(rows);
                }
            })
    })
}


function checkForDuplicates(uname, contact_number, plan, startdate) {
    let data = getFromCustomers(uname, contact_number)
                .then(function(results){
                    return results;
                }).catch(function(err){
                    return err;
                })

    data.then(function(result) {
        for(let i = 0; i < result.length; i++){
            if(result[i].contact_number == contact_number && result[i].startdate==startdate && result[i].plan == plan){
                return true;
            }
        }
        return false;

    })
}


module.exports = {
    subscriptionHandler,
    getCurrentPlan
};