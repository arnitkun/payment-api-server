
const mysql = require('mysql');
const moment = require('moment');
const request = require('request');

const CONFIG = {
    host: 'db',
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
                ob.amount = Math.abs(totalCost)
            }
            break;
        case "same":
            totalCost = newPlanCost - bal;
            ob.payment_type = "DEBIT";
            ob.amount = totalCost;
            break;
    }
    return JSON.stringify(ob);
}


function planChangeType(pid_past, pid_current){
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
    console.log("days used" + days)
    // return s.diff(e, 'days');
    let amount = getCost(plan);
    let validity = getValidity(plan);
    let cost = amount - ( days * ( amount / validity))
    if(cost < 0){
        return cost*-1;
    }else{
        return cost;
    }

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
    
    getPlan(user_name)
    .then(function(result){
        console.log(result)
        let today = moment().format("YYYY-MM-DD");
        
        let endDate = moment(result[0].end_date);
        console.log(endDate);
        
        let daysLeft = endDate.diff(today, 'days');
        if(daysLeft < 0){
            daysLeft = 0;
        }

        if(daysLeft > getValidity(result[0].plan)){ //assuming that a plan is purchased in the future
            daysLeft = getValidity(result[0].plan);
        }

        console.log(daysLeft)
        res.send(
             {
                 plan: result[0].plan,
                 days_left: daysLeft 
            }
        );
    }).catch(function(err){
        res.send("User not found. Please check username.");
    })
        
    }

function getPlan(uname) {
    return new Promise(function(resolve, reject) {
        connection.query(`select plan, end_date from customers where user_name = ?`, [uname], function(err, res, fields){
            if(err) reject(err.sqlMessage);
            else
            {   
                resolve(res);
            }
        })
    })
} 
    


function paymentRequest(ob, cb) {
    request({
        url: "http://192.168.99.100:3000/payment",
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

function writeToCustomers(uname, contact_number, plan, startdate, endDate, trial) {
    
    return new Promise( function(resolve, reject){
        connection.query(`INSERT INTO customers(user_name, contact_number, plan, \
            start_date, end_date, trials_left) values(?, ?, ?, \
            ?, ?, ?)`,[uname, contact_number, plan, startdate, endDate, trial], function (err, res, fields) {
        if(err) reject(err.sqlMessage);
            else
            { resolve(true);}
        });
    })
}

// function not used 
function removeCustomerPlan(uname, contact, plan){
    return new Promise(function(resolve, reject) {
        connection.query(`DELETE FROM CUSTOMERS WHERE user_name=? AND contact_number=? AND plan=?`,[uname,contact,plan], function(err, res, fields) {
            if(err) reject(err.sqlMessage);
            else{
                resolve(true);
            }
        })
    })
    
}

function updateCustomerPlan(contact, plan, startdate, endDate, trial) {
    return new Promise(function(resolve, reject) {
        connection.query(`UPDATE customers set plan = ?, start_date = ?, end_date = ?, trials_left = ?\
            where contact_number = ?`, [plan, startdate, endDate, trial, contact], function(err, res, fields) {
                if(err) reject(err.sqlMessage);
                else {
                    resolve(true);
                }
            })
    })
}

getFromCustomers = function(uname, contact_number) {
    return new Promise( function(resolve, reject) {
        connection.query('select user_name, contact_number, plan, start_date, end_date, trials_left from customers where \
            user_name = ? AND contact_number = ?;',[uname, contact_number], function(err, rows) {
                if(rows === undefined){
                    reject(new Error("Error: undefined rows."));
                } else {
                    resolve(rows);
                }
            })
    })
}

//unused
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
    
    //check for entries in the db for a partcular user only
    let data = getFromCustomers(user_name, contact_number)
            .then(function(results){
                return results;
            }).catch(function(err){
                return err;
        })   


        data.then(function(result) {

            if(result.length === 0){
                // console.log(startdate);
                let valid = getValidity(New_plan_id);
                let endDate = getEndDate(startdate, valid);
                let trials_left = 1;
                let postData = setPostData(user_name, "same", 0, New_plan_id);
                let cost = postData.amount;
                paymentRequest(postData, function(paymentApiResponse){
                    console.log(paymentApiResponse);
                    let paymentResponse = JSON.parse(paymentApiResponse)
                    
                    console.log("number of trials left: " + trials_left)
                    
                    if(paymentResponse.status == "SUCCESS"){
                
                    if(New_plan_id.toUpperCase() == "TRIAL"){
                        trials_left = 0;
                    }
                    // console.log("Trials left:" + trials_left)
                     writeToCustomers(user_name, contact_number, New_plan_id, startdate, endDate, trials_left)//return value here to send back if it fails
                     .then(function(result){
                        if(result == true){
                            res.send("success");
                            res.send(paymentApiResponse);
                        }
                     }).catch(function(err){//writing to db failed
                        res.send("failed, please check you credentials" + err);
                    })
                     console.log("successful payment.");
                    } else{
                        res.send("Payment failed, please retry.")
                    }
                });
                console.log(postData);//verifying correctness of data being sent
            } else {
                console.log(result);//check the user data from database
                
                    //checking if the user does not subscribe a plan at a date earlier than the 
                    //start date of his current plan 
                    if (startdate < moment(result[0].start_date).format('YYYY-MM-DD')){
                        res.status(400).send({
                            status: 'FAILURE',
                            error:'You can not choose a start date in the past. Why spend for no reason?'
                        });
                        return;
                    }
                //checking duplicates
                if(result[0].contact_number == contact_number && moment(result[0].start_date).format('YYYY-MM-DD') == startdate &&  result[0].plan == New_plan_id){
                        duplicates = true;
                        console.log("duplicate plan!")
                        res.send("You already have that plan!");
                } else
                if(formattedDate(result[0].start_date) <= startdate && formattedDate(result[0].end_date) > startdate){
                        //its either an upgrade or a downgrade; a partial overlap
                        //calculate if the balance and make appropriate debit/credit payment.
                        console.log("upgrading/down from : " + result[0].plan);
                        let changeType = planChangeType(result[0].plan, New_plan_id);
                        let bal = balanceLeft(startdate,formattedDate(result[0].start_date),result[0].plan);
                        // console.log(bal)
                        let postData = setPostData(user_name, changeType, bal, New_plan_id);
                        console.log(postData)//verifying correctness of data being sent
                        paymentRequest(postData, function(paymentApiResponse){
                            // console.log(paymentApiResponse);
                            let paymentResponse = JSON.parse(paymentApiResponse)
                            let valid = getValidity(New_plan_id);
                            let endDate = getEndDate(startdate, valid);
                            let cost = getCost(New_plan_id);
                            let trials_left = result[0].trials_left;
                            // console.log("Trials left" + trials_left)
                            
                            if(paymentResponse.status == "SUCCESS"){
                                if(New_plan_id.toUpperCase() == "TRIAL" && trials_left == 0){
                                    console.log("Trial exhausted, cant reuse.");
                                    res.send("Trial exhausted. Cant update.")
                                }
                                if(New_plan_id.toUpperCase() == "TRIAL" && trials_left == 1){
                                    trials_left = 0;
                                }
                            updateCustomerPlan(contact_number, New_plan_id, startdate, endDate, trials_left)
                            .then(function(result){
                                if(result == true){
                                    res.send("Successfully updated plan.")
                                }
                            }).catch(function(err) {
                                res.send("Failed, you already have that plan.")
                            })

                            }else{//payment failed
                                res.send("Payment failed, retry")
                            }
                        });
                    }
                 if(result[0].plan == "TRIAL" && New_plan_id=="TRIAL"){
                    trial = true;
                    console.log("Trial is exhausted for the user!");
                    res.send("You have exhausted your trial period.");
                }
        }
    });
}


module.exports = {
    subscriptionHandler,
    getCurrentPlan
};