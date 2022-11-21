import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as s3deploy from "aws-cdk-lib/aws-s3-deployment";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import * as acm from "aws-cdk-lib/aws-certificatemanager";
import * as iam from "aws-cdk-lib/aws-iam";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as path from "path";
import * as apigateway from "aws-cdk-lib/aws-apigateway";

interface StatelessStackProps extends cdk.StackProps {
  readonly certificate?: acm.Certificate;
  readonly isProduction: boolean;
}
export class StatelessStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: StatelessStackProps) {
    super(scope, id, props);

    const { certificate, isProduction } = props;

    // Create a S3 bucket to host the static website
    const CloudResumeBucket = new s3.Bucket(this, "CloudResumeBucket", {
      //bucketName: "nourez-dev",
      publicReadAccess: true,
      autoDeleteObjects: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      websiteIndexDocument: "index.html",
      websiteErrorDocument: "error.html",
    });

    // if a certificate is provided, create a CloudFront distribution using custom domain
    // otherwise, create a CloudFront distribution default domain
    const CloudResumeDistribution = isProduction
      ? new cloudfront.Distribution(this, "CloudResumeDistribution", {
          defaultBehavior: {
            origin: new origins.S3Origin(CloudResumeBucket),
            viewerProtocolPolicy:
              cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          },
          domainNames: ["nourez.dev", "www.nourez.dev"],
          certificate: certificate,
        })
      : new cloudfront.Distribution(this, "CloudResumeDistribution", {
          defaultBehavior: {
            origin: new origins.S3Origin(CloudResumeBucket),
            viewerProtocolPolicy:
              cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          },
        });

    // Output the CloudFront distribution URL
    new cdk.CfnOutput(this, "CloudResumeDistributionURL", {
      value: CloudResumeDistribution.distributionDomainName,
    });

    // Deploy the static website content to the S3 bucket
    const CloudResumeDeployment = new s3deploy.BucketDeployment(
      this,
      "CloudResumeBucketDeployment",
      {
        sources: [s3deploy.Source.asset("../frontend")],
        destinationBucket: CloudResumeBucket,
        distribution: CloudResumeDistribution,
      }
    );

    // Create a role for the Lambda to access DynamoDB and write CloudWatch logs
    const CloudResumeLambdaRole = new iam.Role(this, "CloudResumeLambdaRole", {
      assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
    });

    // Give the Lambda role permission to DynamoDB
    CloudResumeLambdaRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonDynamoDBFullAccess")
    );

    //Give the Lambda role permission to write CloudWatch logs
    CloudResumeLambdaRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName("CloudWatchLogsFullAccess")
    );

    const CloudResumeLambda = new lambda.Function(this, "CloudResumeLambda", {
      runtime: lambda.Runtime.PYTHON_3_9,
      handler: "lambda_function.lambda_handler",
      code: lambda.Code.fromAsset(path.join(__dirname, "../../api")),
      role: CloudResumeLambdaRole,
    });

    // Create an API Gateway REST API
    const CloudResumeAPI = new apigateway.LambdaRestApi(
      this,
      "CloudResumeAPI",
      {
        handler: CloudResumeLambda,
        proxy: false,
      }
    );

    const page = CloudResumeAPI.root.addResource("page");
    page.addMethod("GET");
    page.addMethod("POST");

    const pages = CloudResumeAPI.root.addResource("pages");
    pages.addMethod("GET");

    // Output the API Gateway URL
    new cdk.CfnOutput(this, "CloudResumeAPIURL", {
      value: CloudResumeAPI.url,
    });
  }
}
