# TrailDash2

A Serverless Dashboard system to display and filter AWS CloudTrail Logs
![Dashboard](/documentation/image1.png)


## What is TrailDash2?

TrailDash2 comes from a tool called TrailDash developed by the team from AppliedTrust https://github.com/AppliedTrust/traildash

Unfortunately they have EOL their tool and creating your own dashboard from scratch isn't that straight forward.

Enter TrailDash2, much like the original, however now completely serverless. Traildash2 uses AWS Lambda to capture the AWS CloudTrail logs and send them into AWS ElasticSearch 5.

The Dashboard shown is using the built in the Kibana that comes with the AWS ElasticSearch service. The Dashboard configuration can be imported from this Repo directly into your AWS ElasticSearch to obtain the same dashboard.

The repo includes CloudFormation Templates that can be applied to your AWS account that will perform the deployment of AWS ElasticSearch and AWS Lambda functions.



## Installation and Usage instructions
For those familiar with AWS. CloudFormation is in **/cloudformation/**, Lambda code is in **/lambda-code/** and you'll need to setup an event trigger on your CloudTrail bucket to call the Lambda function.

For everyone else see below! :)

1. Git clone the repo or download the whole thing from the release page

2. Upload **/lambda-code/index.js.zip** file to an S3 bucket

3. Deploy the CloudFormation template to create your ElasticSearch server: **cloudformation/elastic-search-single-server.json**. Most of the default configuration should be fine. Set the AllowedAccessIPs to an IP address that you would like to be able to access Kibana from.

4. Wait for ElasticSearch stack to create. Once the stack has been create, copy down the **CNAME ES endpoint** URL provided in the stack output

5. Deploy the CloudFormation template to create your Lambda Function: **cloudformation/lambda-traildash2.json**. In the lambda template you will be required to fill in some parameters
    * Enter in the elasticserach address that was provided from the previous step.

    * Enter in the name of the S3 bucket that you uploaded the lambda index.js.zip file into.

    * enter in the keypath to the index.js.zip file. If you upload the file into the root of the bucket that will be **index.js.zip**. If it was a subfolder like code then it will be **code/index.js.zip**

    * Enter in the S3 bucket name where your CloudTrail logs are being saved to

6.

---
