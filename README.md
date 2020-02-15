# Sensibull Fullstack Dev Challenge

## Overview

You have been assigned with creating the primary REST service for "Subscription as a Service" startup called **Sub-ji** (This PJ is also indicative of the kind of people you will be working with should you choose to join us).

Your REST service will be used by companies that will define subscriptions plans to which the users of the platform can subscribe to.

## Instructions

### General Instructions

There may be edge cases that you come up against. You are free to handle them in any way you see fit, provided you explain what your assumptions are along with your submission (preferably in the README).

Please create an API that is:
1.  Clean and easily understandable
2.  Extensible at a later time.
3.  Cover the edge cases.

### Technical Instructions

- You can implement the API in any language of your choice, in a runtime of your choice.
- You MUST use an RDBMS to store data (one of Postgres or MySQL). 
- The API server you use to deploy this service, the RDBMS used to store data, along with the Payment Server that is part of this repo (see below) needs to be consolidated into a `docker-compose.yml` file so that the entire service assembly can be brought up and run via `docker-compose up`.

### Submission

Your submission can be in one of two forms:

##### Shared Private Repo

- You can upload your submission to a private repo on Gitlab, Github or Bitbucket 
- Please make sure that you keep this repo private. Please do not share this challenge with anyone.
- Please add the following handle as a collaborator in your repo: `balajeerc` (This handle is valid on all three sites: Gitlab, Github, Bitbucket)

##### Tar Zipped Archive with Git Repo

- You can also just create a tar.gz file containing a git repo of the solution
- The git repo needs to track the commits you made as you solved the challenge. This is so that we can see how your code evolved.
## User Subscription API

The primary objective is to provide the user subscription API that provides (at the minimum) endpoints to do the following:

### Upgrade/Downgrade Subscription Plans

The service needs to provide mechanisms to upgrade/downgrade user subscriptions.

- The timestamp indicates the start date for the new plan, and it will be valid for the number of days shown in the table below (see Plans).
- The service is expected to check if the new plan addition entails an upgrade of plans or a downgrade. 
    - If it is an upgrade, the service must make a call to the Payment API server (see below), with a debit of the amount applicable for the upgrade. 
    - If it is a downgrade, make a credit request with the appropriate amount to the Payment API server.
- Once payment succeeds, this service shall make the necessary changes in database to update the user's subscription plan.

**Inputs**:
- User name
- Time stamp (in YYYY-MM-DD format)
- New plan ID

**Expected outputs**:
- Status: `SUCCESS` only if the payment API request succeeded. `FAILURE` otherwise.

**Constraints**:
- A `TRIAL` plan may be enabled only once per user.
- **[OPTIONAL/BONUS CREDIT]**: Consider the case, where the user starts on a `PRO_6M` subscription, and 30 days later, downgrades to `FREE`, thus effective enjoying a `PRO_1M` plan at a discount. How would you handle this scenario, considering that such an action should still be permissible to the user.
 
**Additional points of Note**:
- The timestamp indicates the date at which the subscription is being changed. (Basically, assume timestamp is the current date at the time of service invocation.)
- All upgrades or downgrades must involve a pro-rata credit or debit as may be applicable factoring in the number of days left in the existing plan (if any). 

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

##  Plans 

The plans provided by the subscription service shall be as shown in the table below:

| Plan ID     | Validity (in days) | Cost (USD) 
| ----------- | ------------------ | -----------   
| FREE	      | -				   | 0.0
| TRIAL	      | 7				   | 0.0
| LITE_1M	  | 30				   | 100.0
| PRO_1M	  | 30				   | 200.0
| LITE_6M	  | 180				   | 500.0
| PRO_6M	  | 180				   | 900.0

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
- This service is implemented so that it intentionally errors out sometimes (approx 25% calls fail). This failiure needs to be handled appropriately in the subscriptions service.


### Running the Payment Server

- A reasonably recent version of Node is a pre-requisite. Preferably: v9.x+
- The API server can be started with:

```bash
npm install
npm run start
```

