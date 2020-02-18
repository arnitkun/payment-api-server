
## Overview

This is a REST service providing "Subscription as a service".

It provides endpoints for the following user subscription APIs:

1. Getting the current subscription plan.
2. Subscribing/Upgrading/downgrading a plan. 

If the new subscription is an upgrade/downgrade, the API checks if there is any left over amount (due to cancelling the previous plan in case of upgrade)
 and call the payment API with the credentials of the user. Only after the payment succeeds does the database gets updated.

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

##### Shared Private Repo

- You can upload your submission to a private repo on Gitlab, Github or Bitbucket 
- Please make sure that you keep this repo private. Please do not share this challenge with anyone.
- Please add the following handle as a collaborator in your repo: `balajeerc` (This handle is valid on all three sites: Gitlab, Github, Bitbucket)

**Inputs**:
- User name
- Time stamp (in YYYY-MM-DD format)
- New plan ID
- contact number (Additional input to maintain uniqueness)

**outputs**:
- Status: `SUCCESS` if the payment API request succeeded. `FAILURE` otherwise.

### Retrieve Current Subscription Plan for a Specified User

**Inputs**:
- User name
- Time stamp (in `YYYY-MM-DD` format)

**Expected outputs**:
- Plan id that will be active for user at specified date (see table in Plans section below)
- Number of days left in plan
- If timestamp is not specifed, list all subscription entries available in database along with start and valid till dates for the user.

**Additional points of Note**:
- The timestamp indicates the date at which the query is being made. 
    - Basically, assume timestamp is the current date at the time of service invocation.
- For eg. if  `TRIAL` subscription plan started on `2018-10-01` and we make a query to this service with a time stamp of `2018-10-05`, it should say that there are 2 days left.

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

- This service is implemented so that it intentionally errors out sometimes (approx 25% calls fail). This failiure needs to be handled appropriately in     the subscriptions service. To handle this, the subscription API rejects the subscription request stating "Payment Failed" and asks the user
  to reinitiate the payment.

### Running the Payment Server

- A reasonably recent version of Node is a pre-requisite. Preferably: v9.x+
- The API server can be started with:

```bash
npm install
npm run start
```

