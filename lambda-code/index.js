/*
    Auther: Adcreare
    Purpose: A Lambda function to be attached to an S3 bucket as a Trigger to consume cloudtrail events
            and load them into elastic search.

            Function will process S3 put event object, will download the supplied file
            Gunzip extract the json payload and them load that into elastic search

            Designed specifically as part of the TrailDash2 project
*/


var AWS = require('aws-sdk')
var zlib = require('zlib');


/* Const Globals */
var s3 = new AWS.S3();
var esDomain = {
    region: 'us-east-1',
    index: 'logstash-',
    doctype: 'cloudtrail'
};

var s3 = new AWS.S3();

/*
 * The AWS credentials are picked up from the environment.
 * They belong to the IAM role assigned to the Lambda function.
 * Since the ES requests are signed using these credentials,
 * make sure to apply a policy that permits ES domain operations
 * to the role.
 */
var creds = new AWS.EnvironmentCredentials('AWS');



/* Lambda "main": Execution starts here */
exports.handler = function(event, context, callback) {
    //setup the callback and esurl so we can access that across functions without a prototype or bind
    global.lambdaCallback = callback;
    global.elasticsearchURL = process.env.elasticsearchurl


    console.log(JSON.stringify(event)); //log the recreived event

    //download item from S3 to disk
    var params = {}
    params.Bucket = event.Records[0].s3.bucket.name;
    params.Key = event.Records[0].s3.object.key;

    s3.getObject(params, function(err, data) {
        if (err)
        {
            console.log(err, err.stack); // an error occurred
            global.lambdaCallback(err,'ERROR downloading from S3') //exit funtion
        }
        else
        {
            //if call is all good then run the buffer through extractFile
            extractFile(data.Body); // successful response
        }
    });
}

//Function to extract a gzip file
function extractFile(buffer)
{
  zlib.gunzip(buffer,extractFileCallBack)
}

//Callback for file extraction
function extractFileCallBack(error,result)
{
  if (error){
      global.lambdaCallback(error,'unable to extract file!') //exit function
  }
  else
  {
      loadIntoES(JSON.parse(result.toString())); //now load the data into ES
  }
}


//Function process each jsonpayload into a ES request that is made async
function loadIntoES(jsonPayload)
{
  //jsonPayload.Records.forEach(signAndSendRequestToES(record))

  for (var i = 0; i < jsonPayload.Records.length; i++)
  {
    signAndSendRequestToES(jsonPayload.Records[i]);
  }
}

/*
    Purpose: The main lifting of the code
            1. Works out which ES index to load the json payload into based on the current date
            2. Builds the request
            3. Uses the AWS>Signers.V4 library to sign the request with the IAM credentials
            4. Posts the request to ES using the aws nodehttpclient
*/
function signAndSendRequestToES(singlejsonPayload)
{
  var endpoint =  new AWS.Endpoint(global.elasticsearchURL);
  var req = new AWS.HttpRequest(endpoint);

  //console.log(singlejsonPayload);
  //return 0;
  var date = new Date(singlejsonPayload.eventTime)
  //date = date.getFullYear()+"."+date.getMonth()+"."+date.getDate()
  mytime = date.toISOString();
  mytime = mytime.substring(0,mytime.indexOf('T'));
  date = mytime.replace(/-/g,'.');

  //build request
  req.method = 'POST';
  req.path = '/' +esDomain.index+date+"/"+esDomain.doctype;
  req.region = esDomain.region;
  req.body = JSON.stringify(singlejsonPayload);
  req.headers['presigned-expires'] = false;
  req.headers['Host'] = global.elasticsearchURL;

  // Sign the request (Sigv4)
  var signer = new AWS.Signers.V4(req, 'es');
  signer.addAuthorization(creds, new Date());


  // Post document to ES
  var send = new AWS.NodeHttpClient();

    send.handleRequest(req, null, function(httpResp) {
        var body = '';

        //console.log(httpResp)

        httpResp.on('data', function (chunk) {
            body += chunk;
        });
        httpResp.on('error', function (chunk) {
            console.log("ERRRRROROR")
            console.log(chunk)
            console.log("error chunk above - end")
        });
        httpResp.on('end', function (chunk) {
                console.log('DONE!'); // log done but don't callback - we may have other threds still running here
                console.log('Date is: '+date)
                console.log("--- Elastic Search Response---")
                console.log(body)
                console.log("--- END Elastic Search Response ---")
        });
    }, function(err) {
        console.log('Error: ' + err); /* Log the error - this probably should go to retry at the moment it just fails silently
                                        For cloudtrail this is acceptable for other uses it may not be */
    });
}
