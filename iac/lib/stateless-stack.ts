import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as s3deploy from "aws-cdk-lib/aws-s3-deployment";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import * as acm from "aws-cdk-lib/aws-certificatemanager";
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
      publicReadAccess: true,
      autoDeleteObjects: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      websiteIndexDocument: "index.html",
      websiteErrorDocument: "404.html",
    });

    // Deploy the static website content to the S3 bucket
    const CloudResumeDeployment = new s3deploy.BucketDeployment(
      this,
      "CloudResumeBucketDeployment",
      {
        sources: [s3deploy.Source.asset("../frontend")],
        destinationBucket: CloudResumeBucket,
      }
    );

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
  }
}
