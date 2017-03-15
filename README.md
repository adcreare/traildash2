# TrailDash2

A Serverless Dashboard system to display and filter AWS CloudTrail Logs
![Dashboard](/documentation/image1.png)

## Table of Contents

* [What is TrailDash2?](#what-is-traildash2?)
* [Installation and Usage instructions](#installation-and-usage-instructions)
    * [Part 1: Deploying](#part-1:-Deploying)
    * [Part 2: Setting up the dashboard](#part-2:-setting-up-the-dashboard)
* [Troubleshooting and Known problems](#troubleshooting-and-known-problems)

## What is TrailDash2?

TrailDash2 comes from a tool called TrailDash developed by the team from AppliedTrust https://github.com/AppliedTrust/traildash

Unfortunately they have EOL their tool and creating your own dashboard from scratch isn't that straight forward.

Enter TrailDash2, much like the original, however now completely serverless. Traildash2 uses AWS Lambda to capture the AWS CloudTrail logs and send them into AWS ElasticSearch 5.

The Dashboard shown is using the built in the Kibana that comes with the AWS ElasticSearch service. The Dashboard configuration can be imported from this Repo directly into your AWS ElasticSearch to obtain the same dashboard.

The repo includes CloudFormation Templates that can be applied to your AWS account that will perform the deployment of AWS ElasticSearch and AWS Lambda functions.





## Installation and Usage instructions
For those familiar with AWS. CloudFormation is in **/cloudformation/**, Lambda code is in **/lambda-code/** and you'll need to setup an event trigger on your CloudTrail bucket to call the Lambda function. Then visit the ElasticSearch Kibana interface and import the **/dashboard/kibana-dashboard-export.json** file which imports the dashboard and all the required searches/virtualizations

For everyone else see below! :)


### Part 1: Deploying
1. Git clone the repo or download the whole thing from the release page

2. Upload **/lambda-code/index.js.zip** file to an S3 bucket

3. Deploy the CloudFormation template to create your ElasticSearch server: **cloudformation/elastic-search-single-server.json**. Most of the default configuration should be fine. Set the AllowedAccessIPs to an IP address that you would like to be able to access Kibana from. An example of what the configuration will look like in cloudformation is shown below:
![ESDeployment](/documentation/image2.png)

4. Wait for ElasticSearch stack to create. Once the stack has been create, copy down the **CNAME ES endpoint** URL provided in the stack output
![ESStackOutput](/documentation/image3.png)
Â
5. Deploy the CloudFormation template to create your Lambda Function: **cloudformation/lambda-traildash2.json**. In the lambda template you will be required to fill in some parameters
    * Enter in the elasticserach address that was provided from the previous step.

    * Enter in the name of the S3 bucket that you uploaded the lambda index.js.zip file into.

    * enter in the keypath to the index.js.zip file. If you upload the file into the root of the bucket that will be **index.js.zip**. If it was a subfolder like code then it will be **code/index.js.zip**

    * Enter in the S3 bucket name where your CloudTrail logs are being saved to

    ![CFLambdaDeployment](/documentation/image4.png)

6. Once the stack has successfully deployed the last remaining step is to attach events from the S3 cloudtrail bucket to the Lambda function.
    * Browse to your bucket and select **Properties** and **events**
    ![S3config](/documentation/image5.png)

    * Create a new event filter on **put** operations and select your lambda function from the drop down!
    ![S3event](/documentation/image6.png)

7. Now cloudtrail logs written to S3 events should be starting to be processed by the traildash2 lambda function and will start pushing those into elasticsearch. You can check by looking at the ElasticSearch index's. You should see an index titled logstash-YYYY-MM-DD

### Part 2: Setting up the dashboard
1. Now you can visit your Kibana URL, which you will be able to find in the elastic search console. *Remember you will only be able to access Kibana from an IP in the range that you specified on deployment of the ES service*

2. On load Kibana will ask you to tell it about your index and data. Configure it as shown below:
![kibanaIndex](/documentation/image7.png)

3. While still in management, go to Saved Objects. Click import and select the **/dashboard/kibana-dashboard-export.json** file.
 ![kibanaImport](/documentation/image8.png)

4. If all goes successfully you should see the following saved objects post the import. You can now go and view your dashboard by going to **Dashboard** selecting **open** and selecting **Main-Dashboard**
![kibanaPostImport](/documentation/image9.png)


## Troubleshooting and Known problems
* Kibana shows error bar **Courier Fetch: x of n shards failed**: This is normally due to having selected the incorrect Time-field name in Part 2 of the setup. To fix, go into the AWS elasticsearch console. *Delete* the **.kibana** index. Reload Kibana in your browser and set it up again.

* No data in elasticsearch: Check that the lambda function is being exceuted. If it is being executed check the cloudwatch logs for the result of the call to elasticsearch. If the lambda function is not being called, check that your event trigger in S3 is setup correctly and that the bucket is in the same region as your lambda function

---
