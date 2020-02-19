
## Overview

This is a REST service providing "Subscription as a service".

It provides endpoints for the following user subscription APIs:

1. Getting the current subscription plan.
2. Subscribing/Upgrading/downgrading a plan. 

If the new subscription is an upgrade/downgrade, the API checks if there is any left over amount (due to cancelling the previous plan in case of upgrade)
 and call the payment API with the credentials of the user. Only after the payment succeeds does the database gets updated.

The service maintains a single subscription plan for the user i.e. if you make a subscription in the future and re-subscribe to any other plan,
you will be either charged or refunded on a pro-rata basis. This is done to reduce complexity because eventually a user can only have one 
active plan at any point in time.

##  Plans 

The plans provided by the subscription service are shown in the table below:

| Plan ID     | Validity (in days) | Cost (USD) 
| ----------- | ------------------ | -----------   
| FREE	      | 36500(100 years)	 | 0.0
| TRIAL	      | 7				   | 0.0
| LITE_1M	  | 30				   | 100.0
| PRO_1M	  | 30				   | 200.0
| LITE_6M	  | 180				   | 500.0
| PRO_6M	  | 180				   | 900.0

### Note
1. While the Free plan was required to be infinity, 100 years should suffice.
2. Trial can only be activated once. If a user activates trial and then upgrades/downgrades before trial expires, It can not be reactivated.


### Requirements

1. node
2. mysql
3. express.js for building apis.  
4. moment.js for handling dates.

**Inputs**:

In JSON format:

- User name
- Time stamp (in YYYY-MM-DD format)
- New plan ID
- contact number (Additional input to maintain uniqueness)

**End point**: <url>/subscription
**Request type**: `POST`
**Request body**:
```json
{
  "user_name": <string>,
  "New_plan_id":<string: Plan id>,
  "contact_number":<string: contact number>,
  "startdate":<string>
}
``` 
**Response**:
```Successfully updated plan.``` on success.
```You already have that plan!``` on duplicate plans.
```Trial exhausted, cant reuse.``` on reactivation of trial.
```Payment failed, please retry.``` on payment failure.


**outputs**:
- Status: `SUCCESS` if the payment API request succeeded. `FAILURE` otherwise.

### Retrieve Current Subscription Plan for a Specified User

**Inputs**:
- User name
- Time stamp (in `YYYY-MM-DD` format) // Removed this because we only have one active plan per user.

The input is in JSON format.

**End point**: <url>/currentPlan
**Request type**: `POST`
**Request body**:
```json
{
  "user_name": <string>
}
``` 
**Response body**:
```json
{
  "Plan": <strin: Plan id> // eg. "24242-3443-sdstg-3343",
  "days left": <number: number of days left in the plan>
}
```
**Outputs**:

- Plan id that will be active for user at specified date (see table in Plans section below)
- Number of days left in plan, from the moment the query is made to the service. If the plan has not started,
  the service returns the total validity.

## Payment API

This repo contains a NodeJS server that provides the following service that you will have to access from the user subscriptions service. 
This service provides a single API endpoint described below:
**End point**: <url>/payment
**Request type**: `POST`
**Request body**:
```json
{
  "user_name": <string>,
  "payment_type": <one of "DEBIT"|"CREDIT">,
  "amount": <number>
}
``` 
**Response body**:
```json
{
  "payment_id": <uuid> // eg. "24242-3443-sdstg-3343",
  "status": <one of "SUCCESS"|"FAILIURE">
}
```

**Additional points of Note**:

- This service is implemented so that it intentionally errors out sometimes (approx 25% calls fail). To handle this, the subscription API rejects the       subscription request stating "Payment Failed" and asks the user
  to reinitiate the payment.

### Running the Payment Server

- A reasonably recent version of Node is a pre-requisite. Preferably: v9.x+
- To set up the database, run ```node dbtest.js```. 
- The API server can be started with:

```bash
npm install
npm run start
```

