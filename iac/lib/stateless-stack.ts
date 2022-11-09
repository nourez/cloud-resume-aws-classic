import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as s3deploy from "aws-cdk-lib/aws-s3-deployment";

export class IacStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create a S3 bucket to host the static website
    const MyWebsiteBucket = new s3.Bucket(this, "CloudResumeBucket", {
      publicReadAccess: true,
      autoDeleteObjects: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      websiteIndexDocument: "index.html",
      websiteErrorDocument: "404.html",
    });

    // Deploy the static website content to the S3 bucket
    const MyWebsiteBucketDeployment = new s3deploy.BucketDeployment(
      this,
      "CloudResumeBucketDeployment",
      {
        sources: [s3deploy.Source.asset("../frontend")],
        destinationBucket: MyWebsiteBucket,
      }
    );
  }
}
